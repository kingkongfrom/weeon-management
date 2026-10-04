"use server";

import { getPlatformSession } from "@/lib/auth/session";
import { writeTenantOpsAudit } from "@/lib/platform/ops-audit";
import { extendDemoWindow } from "@/lib/platform/provisioning";

export type DemoWindowActionState =
  | null
  | { ok: string }
  | { error: string };

export async function extendDemoWindowAction(
  _prev: DemoWindowActionState,
  formData: FormData,
): Promise<DemoWindowActionState> {
  const { user } = await getPlatformSession();
  if (!user) {
    return { error: "Your session expired. Sign in again." };
  }

  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const extraDays = Number(formData.get("extraDays"));

  const result = await extendDemoWindow({ tenantId, extraDays });
  if (!result.ok) {
    return { error: result.error };
  }

  const audit = await writeTenantOpsAudit({
    tenantId,
    actor: { userId: user.id, email: user.email ?? null },
    action: "demo.extended",
    beforeValue: { demoEndsAt: result.previousDemoEndsAt },
    afterValue: { demoEndsAt: result.demoEndsAt, extraDays },
  });
  if (!audit.ok) {
    console.warn("[demo-window] audit failed:", audit.error);
  }

  return { ok: "Demo window extended." };
}
