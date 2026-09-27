"use server";

import { revalidatePath } from "next/cache";
import { getPlatformSession } from "@/lib/auth/session";
import {
  isManualStatusAction,
  parseSuspendReason,
  setTenantStatus,
} from "@/lib/platform/tenant-status";
import { writeTenantOpsAudit, type TenantOpsAction } from "@/lib/platform/ops-audit";
import { sendSchoolSuspensionEmail } from "@/lib/email/suspension-email";
import { listTenantAdmins } from "@/lib/platform/metrics";

export type TenantStatusActionState = { ok?: string; error?: string } | null;

const AUDIT_ACTION: Record<string, TenantOpsAction> = {
  suspend: "status.suspend",
  reactivate: "status.reactivate",
  mark_past_due: "status.past_due",
  mark_active: "status.active",
};

/**
 * Suspend / reactivate a school from Ops. Only the manual status subset is
 * accepted (see `lib/platform/tenant-status.ts`); trial/demo transitions stay
 * automated.
 *
 * Suspending records a reason (payment hold vs manual hold) and emails the
 * school's administrators so they learn *why* before their staff hit a
 * read-only wall. Email failure never blocks the status change — it is reported
 * back in the success message instead.
 */
export async function setTenantStatusAction(
  _prev: TenantStatusActionState,
  formData: FormData,
): Promise<TenantStatusActionState> {
  const { user, sessionUser } = await getPlatformSession();
  if (!user) {
    return { error: "Your session expired. Sign in again." };
  }

  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  if (!tenantId || !isManualStatusAction(action)) {
    return { error: "Invalid school status change." };
  }

  const reason =
    action === "suspend"
      ? parseSuspendReason(String(formData.get("reason") ?? "manual"))
      : undefined;

  const result = await setTenantStatus({ tenantId, action, reason });
  if (!result.ok) {
    return { error: result.error };
  }

  await writeTenantOpsAudit({
    tenantId,
    actor: { userId: user.id, email: sessionUser?.email ?? null },
    action: AUDIT_ACTION[action] ?? "status.active",
    target: "status",
    beforeValue: { status: result.previousStatus },
    afterValue: {
      status: result.status,
      ...(result.suspendReason ? { reason: result.suspendReason } : {}),
      ...(result.readOnlyAt ? { readOnlyAt: result.readOnlyAt } : {}),
    },
  });

  let emailNote = "";
  if (action === "suspend" && result.suspendReason) {
    const admins = await listTenantAdmins(tenantId).catch(() => []);
    const recipients = admins
      .map((admin) => admin.email)
      .filter((email): email is string => Boolean(email && email.trim()));
    if (recipients.length > 0) {
      const sent = await sendSchoolSuspensionEmail({
        to: recipients,
        reason: result.suspendReason,
        readOnlyAt: result.readOnlyAt,
      });
      emailNote = sent.success
        ? ` Admin notice sent to ${recipients.length} address(es).`
        : ` Admin notice failed: ${sent.error}`;
    }
  }

  revalidatePath(`/dashboard/tenants/${tenantId}`);
  revalidatePath("/dashboard/tenants");
  return {
    ok:
      action === "suspend"
        ? `School suspended (${result.suspendReason === "manual" ? "manual hold" : "payment hold"}).${emailNote}`
        : action === "mark_past_due"
          ? "School marked past due."
          : "School reactivated.",
  };
}
