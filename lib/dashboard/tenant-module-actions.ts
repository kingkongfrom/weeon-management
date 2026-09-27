"use server";

import { revalidatePath } from "next/cache";
import { getPlatformSession } from "@/lib/auth/session";
import { setTenantModuleEnabled } from "@/lib/platform/tenant-modules";
import { writeTenantOpsAudit } from "@/lib/platform/ops-audit";

export type TenantModuleActionState = { ok?: string; error?: string } | null;

/**
 * Enable/disable a paid module for a school. Core modules are rejected by the
 * data layer — the plan minimum cannot be switched off.
 */
export async function setTenantModuleAction(
  _prev: TenantModuleActionState,
  formData: FormData,
): Promise<TenantModuleActionState> {
  const { user, sessionUser } = await getPlatformSession();
  if (!user) {
    return { error: "Your session expired. Sign in again." };
  }

  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const moduleKey = String(formData.get("moduleKey") ?? "").trim();
  const enabledRaw = String(formData.get("enabled") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || "Module";
  if (!tenantId || !moduleKey) {
    return { error: "Missing school or module." };
  }

  const enabled = enabledRaw === "true";
  const result = await setTenantModuleEnabled({ tenantId, moduleKey, enabled });
  if (!result.ok) {
    return { error: result.error };
  }

  await writeTenantOpsAudit({
    tenantId,
    actor: { userId: user.id, email: sessionUser?.email ?? null },
    action: enabled ? "module.enabled" : "module.disabled",
    target: moduleKey,
    beforeValue: { enabled: result.previousEnabled },
    afterValue: { enabled },
  });

  revalidatePath(`/dashboard/tenants/${tenantId}`);
  return {
    ok: enabled
      ? `${label} enabled for this school.`
      : `${label} disabled.`,
  };
}
