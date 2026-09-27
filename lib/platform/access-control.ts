import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";
import {
  resolveAccountStatusLabel,
  resolveProfileEmail,
  resolveRoleLabel,
} from "@/lib/domain";

/**
 * Cross-tenant **administrator** accounts — the only user kind Ops manages.
 * Teachers, students, and guardians belong to the school, not to Weeon.
 *
 * Read through the platform (service-role) client: this is a cross-tenant view,
 * so tenant RLS never applies. Never expose the result to a non-ops caller.
 */
export type AdminAccount = {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantStatus: string;
  name: string;
  username: string | null;
  email: string;
  role: string;
  /** Human label for `role` (e.g. "School administrator"). */
  roleLabel: string;
  /** `profiles.account_status` — e.g. `pending_first_login`, `active`. */
  accountStatus: string;
  /** Human label for `accountStatus` (e.g. "Pending first login"). */
  accountStatusLabel: string;
  active: boolean;
  emailSentAt: string | null;
  /**
   * Real sign-in signal from **Supabase Auth** (`auth.users.last_sign_in_at`).
   * `profiles.first_login_at` exists in the schema but is never written by any
   * app — login activity lives in Auth, not `profiles`.
   */
  lastSignInAt: string | null;
  /**
   * When this user last completed a password reset (`admin_password_resets`).
   * A proxy for "last password change" — there is no
   * `password_updated_at` on `profiles` yet (see docs/access-control.md).
   */
  passwordResetAt: string | null;
  createdAt: string;
};

type ProfileRow = {
  id: string;
  tenant_id: string;
  role: string;
  account_status: string | null;
  active: boolean | null;
  name: string | null;
  username: string | null;
  email: string | null;
  auth_email: string | null;
  email_sent_at: string | null;
  first_login_at: string | null;
  provisioned_at: string | null;
  created_at: string;
  tenants: { name: string | null; status: string | null } | { name: string | null; status: string | null }[] | null;
};

function tenantOf(row: ProfileRow): { name: string; status: string } {
  const rel = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
  return {
    name: rel?.name?.trim() || "—",
    status: rel?.status ?? "unknown",
  };
}

/** Administrator accounts across every tenant, newest first. */
export async function listAdminAccounts(): Promise<{
  accounts: AdminAccount[];
  reason?: string;
}> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      accounts: [],
      reason:
        "Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    };
  }

  const client = createPlatformClient();
  const { data, error } = await client
    .from("profiles")
    .select(
      "id, tenant_id, role, account_status, active, name, username, email, auth_email, email_sent_at, first_login_at, provisioned_at, created_at, tenants(name, status)",
    )
    .eq("role", "admin")
    // Soft-deleted admins are retained for 72h then purged; keep them out of the
    // working directory so Ops only sees live accounts.
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return { accounts: [], reason: `Admin accounts read failed: ${error.message}` };
  }

  const rows = (data ?? []) as ProfileRow[];

  const ids = rows.map((row) => row.id);

  // Supabase Auth is the only place login activity is recorded. Pull it via the
  // Admin API and merge by user id — `profiles.first_login_at` is never written.
  //
  // We use per-user `getUserById` rather than `listUsers`: on this project
  // `listUsers` returns HTTP 500 ("Database error finding users") while single
  // lookups work. Admins are a small set, so N lookups are cheap and reliable.
  const lastSignInByUser = new Map<string, string | null>();
  await Promise.all(
    ids.map(async (id) => {
      try {
        const { data, error } = await client.auth.admin.getUserById(id);
        if (error) {
          console.error(
            `[access-control] auth.admin.getUserById failed for ${id}:`,
            error.message,
          );
          return;
        }
        lastSignInByUser.set(id, data.user?.last_sign_in_at ?? null);
      } catch (error) {
        console.error(
          `[access-control] auth.admin.getUserById threw for ${id}:`,
          error,
        );
      }
    }),
  );

  // Latest consumed password reset per user — the closest available signal to
  // "last password change" (there is no `profiles.password_updated_at` yet).
  const passwordResetByUser = new Map<string, string>();
  if (ids.length > 0) {
    const { data: resets } = await client
      .from("admin_password_resets")
      .select("user_id, consumed_at")
      .in("user_id", ids)
      .not("consumed_at", "is", null)
      .order("consumed_at", { ascending: false });
    for (const reset of (resets ?? []) as {
      user_id: string;
      consumed_at: string | null;
    }[]) {
      if (reset.consumed_at && !passwordResetByUser.has(reset.user_id)) {
        passwordResetByUser.set(reset.user_id, reset.consumed_at);
      }
    }
  }

  const accounts = rows.map((row) => {
    const tenant = tenantOf(row);
    return {
      id: row.id,
      tenantId: row.tenant_id,
      tenantName: tenant.name,
      tenantStatus: tenant.status,
      name: row.name?.trim() || "—",
      username: row.username?.trim() || null,
      email: resolveProfileEmail({
        email: row.email ?? "",
        auth_email: row.auth_email,
      }),
      role: row.role,
      roleLabel: resolveRoleLabel(row.role),
      accountStatus: row.account_status ?? "active",
      accountStatusLabel: resolveAccountStatusLabel(row.account_status),
      active: row.active ?? true,
      emailSentAt: row.email_sent_at,
      lastSignInAt: lastSignInByUser.get(row.id) ?? null,
      passwordResetAt: passwordResetByUser.get(row.id) ?? null,
      createdAt: row.created_at,
    };
  });

  return { accounts };
}

export type AdminMutationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Suspend (deactivate) or reactivate a school administrator.
 *
 * Suspension sets `account_status = 'suspended'`, which:
 *   - blocks sign-in (`lib/auth/actions.ts` in `weeon-tenants`), and
 *   - blocks already-issued sessions (`requireSchoolAdmin`), so it takes effect
 *     immediately rather than at JWT expiry.
 *
 * Reactivation restores `active` and clears the reason, but refuses to touch a
 * soft-deleted row (that one is on its way to the 72h purge).
 */
export async function setAdminSuspended(input: {
  profileId: string;
  suspended: boolean;
  reason?: string | null;
}): Promise<AdminMutationResult> {
  const client = createPlatformClient();

  const { data: existing, error: readError } = await client
    .from("profiles")
    .select("account_status, deleted_at")
    .eq("id", input.profileId)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };
  if (!existing) return { ok: false, error: "Account not found." };
  if (existing.deleted_at !== null) {
    return { ok: false, error: "This account is deleted and cannot be changed." };
  }

  const { error } = await client
    .from("profiles")
    .update({
      account_status: input.suspended ? "suspended" : "active",
      status_reason: input.suspended ? (input.reason ?? null) : null,
      status_changed_at: new Date().toISOString(),
    })
    .eq("id", input.profileId);
  if (error) return { ok: false, error: error.message };

  // Kill live sessions so a suspended admin loses access at once.
  if (input.suspended) {
    await revokeAuthSessions(input.profileId);
  }

  return { ok: true };
}

/**
 * Soft-delete a school administrator: stamp `deleted_at`, then **anonymize** the
 * Auth user so the credential is destroyed but the row survives for audit.
 *
 * We never hard-delete the Auth user here — the profile row is retained for 72h
 * (see `purge_deleted_profiles` in `weeon-tenants`) and the anonymized Auth row
 * keeps referential history intact. Retention is a schema-side concern; this
 * only does the reversible part.
 */
export async function deleteAdminAccount(input: {
  profileId: string;
  actorUserId: string;
  reason?: string | null;
}): Promise<AdminMutationResult> {
  const client = createPlatformClient();

  const { data: existing, error: readError } = await client
    .from("profiles")
    .select("id, email, auth_email, deleted_at")
    .eq("id", input.profileId)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };
  if (!existing) return { ok: false, error: "Account not found." };
  if (existing.deleted_at !== null) {
    return { ok: false, error: "This account is already deleted." };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await client
    .from("profiles")
    .update({
      deleted_at: now,
      deleted_by: input.actorUserId,
      status_reason: input.reason ?? null,
      account_status: "suspended",
      active: false,
      status_changed_at: now,
    })
    .eq("id", input.profileId);
  if (updateError) return { ok: false, error: updateError.message };

  // Destroy the credential: no usable Auth identity survives the delete. The
  // row is kept (anonymized) so audit history and FK references stay valid.
  const anonymizedEmail = `deleted+${input.profileId}@removed.weeon.school`;
  const { error: authError } = await client.auth.admin.updateUserById(
    input.profileId,
    {
      email: anonymizedEmail,
      email_confirm: true,
      password: crypto.randomUUID() + crypto.randomUUID(),
      user_metadata: { deleted: true, deleted_at: now },
      ban_duration: "876000h", // ~100 years — effectively banned
    },
  );
  if (authError) {
    // The soft delete stands; report so Ops can finish manually if needed.
    return {
      ok: false,
      error: `Profile marked deleted, but the Auth user could not be anonymized: ${authError.message}`,
    };
  }

  await revokeAuthSessions(input.profileId);
  return { ok: true };
}

/** Best-effort session revocation; failure never blocks the state change. */
async function revokeAuthSessions(userId: string): Promise<void> {
  try {
    const client = createPlatformClient();
    await client.auth.admin.signOut(userId, "global");
  } catch {
    // Sessions also die at token expiry; the profile gate blocks use meanwhile.
  }
}
