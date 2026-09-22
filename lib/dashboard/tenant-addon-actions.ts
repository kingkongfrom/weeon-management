"use server";

import { revalidatePath } from "next/cache";
import { getPlatformSession } from "@/lib/auth/session";
import { setParentPaymentsAddonEnabled } from "@/lib/platform/parent-payments-addon";

export type ParentPaymentsAddonActionState = { ok?: string; error?: string } | null;

export async function setParentPaymentsAddonAction(
  _prev: ParentPaymentsAddonActionState,
  formData: FormData,
): Promise<ParentPaymentsAddonActionState> {
  const { user } = await getPlatformSession();
  if (!user) {
    return { error: "Your session expired. Sign in again." };
  }

  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const enabledRaw = String(formData.get("enabled") ?? "").trim();
  if (!tenantId) {
    return { error: "Missing tenant." };
  }

  const enabled = enabledRaw === "true";
  const result = await setParentPaymentsAddonEnabled({ tenantId, enabled });
  if (!result.ok) {
    return { error: "Could not update the add-on. Check Supabase migration status." };
  }

  revalidatePath(`/dashboard/tenants/${tenantId}`);
  return {
    ok: enabled
      ? "Parent Payments add-on enabled for this school."
      : "Parent Payments add-on disabled.",
  };
}
