import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";
import { listTenantModules, setTenantModuleEnabled } from "@/lib/platform/tenant-modules";

export type ParentPaymentsAddonStatus = {
  enabled: boolean;
  enabledAt: string | null;
  paymentsReady: boolean;
};

export async function getParentPaymentsAddonStatus(
  tenantId: string,
): Promise<ParentPaymentsAddonStatus> {
  const client = createPlatformClient();
  const [modules, providerRes] = await Promise.all([
    listTenantModules(tenantId),
    client
      .from("tenant_payment_providers")
      .select("tenant_id")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  const addon = modules.find((module) => module.key === "parent_payments");

  return {
    enabled: Boolean(addon?.enabled),
    enabledAt: addon?.enabledAt ?? null,
    paymentsReady: Boolean(providerRes.data),
  };
}

export async function setParentPaymentsAddonEnabled(input: {
  tenantId: string;
  enabled: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return setTenantModuleEnabled({
    tenantId: input.tenantId,
    moduleKey: "parent_payments",
    enabled: input.enabled,
  });
}
