import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";
import { resolveProfileEmail } from "@/lib/domain";

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
  /** `profiles.account_status` — e.g. `pending_first_login`, `active`. */
  accountStatus: string;
  active: boolean;
  emailSentAt: string | null;
  firstLoginAt: string | null;
  provisionedAt: string | null;
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
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return { accounts: [], reason: `Admin accounts read failed: ${error.message}` };
  }

  const accounts = ((data ?? []) as ProfileRow[]).map((row) => {
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
      accountStatus: row.account_status ?? "active",
      active: row.active ?? true,
      emailSentAt: row.email_sent_at,
      firstLoginAt: row.first_login_at,
      provisionedAt: row.provisioned_at,
      createdAt: row.created_at,
    };
  });

  return { accounts };
}
