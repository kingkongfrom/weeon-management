"use server";

import { revalidatePath } from "next/cache";
import { getPlatformSession } from "@/lib/auth/session";
import {
  deleteAdminAccount,
  setAdminSuspended,
} from "@/lib/platform/access-control";
import { writeTenantOpsAudit } from "@/lib/platform/ops-audit";

export type AdminActionState = { ok?: string; error?: string } | null;

async function requireOpsActor(): Promise<
  | { ok: true; userId: string; email: string | null }
  | { ok: false; error: string }
> {
  const { user, sessionUser } = await getPlatformSession();
  if (!user) return { ok: false, error: "Your session expired. Sign in again." };
  return { ok: true, userId: user.id, email: sessionUser?.email ?? null };
}

/**
 * Suspend (deactivate) or reactivate a school administrator. Ops-only.
 *
 * The audit row lives on the tenant so it appears in the school's Activity tab;
 * `target` carries the profile id.
 */
export async function setAdminSuspendedAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireOpsActor();
  if (!actor.ok) return { error: actor.error };

  const profileId = String(formData.get("profileId") ?? "").trim();
  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const suspended = String(formData.get("suspended") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!profileId || !tenantId) {
    return { error: "Invalid administrator action." };
  }

  const result = await setAdminSuspended({ profileId, suspended, reason });
  if (!result.ok) return { error: result.error };

  await writeTenantOpsAudit({
    tenantId,
    actor: { userId: actor.userId, email: actor.email },
    action: suspended ? "admin.suspended" : "admin.reactivated",
    target: profileId,
    beforeValue: { accountStatus: suspended ? "active" : "suspended" },
    afterValue: {
      accountStatus: suspended ? "suspended" : "active",
      name,
      ...(reason ? { reason } : {}),
    },
  });

  revalidatePath("/dashboard/access");
  revalidatePath(`/dashboard/tenants/${tenantId}`);
  return {
    ok: suspended
      ? `${name || "Administrator"} suspended. They can no longer sign in.`
      : `${name || "Administrator"} reactivated.`,
  };
}

/**
 * Soft-delete a school administrator: retained for 72h, then purged. The Auth
 * user is anonymized immediately so no usable credential survives.
 */
export async function deleteAdminAccountAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireOpsActor();
  if (!actor.ok) return { error: actor.error };

  const profileId = String(formData.get("profileId") ?? "").trim();
  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (!profileId || !tenantId) {
    return { error: "Invalid administrator action." };
  }
  // Guard against an accidental submit without the typed confirmation.
  if (confirm.toUpperCase() !== "DELETE") {
    return { error: "Type DELETE to confirm." };
  }

  const result = await deleteAdminAccount({
    profileId,
    actorUserId: actor.userId,
    reason,
  });
  if (!result.ok) return { error: result.error };

  await writeTenantOpsAudit({
    tenantId,
    actor: { userId: actor.userId, email: actor.email },
    action: "admin.deleted",
    target: profileId,
    beforeValue: { deleted: false },
    afterValue: {
      deleted: true,
      name,
      retentionHours: 72,
      ...(reason ? { reason } : {}),
    },
  });

  revalidatePath("/dashboard/access");
  revalidatePath(`/dashboard/tenants/${tenantId}`);
  return {
    ok: `${name || "Administrator"} deleted. The record is kept for 72 hours, then purged.`,
  };
}
