import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";

export type ParentPaymentsAddonStatus = {
  enabled: boolean;
  enabledAt: string | null;
  paymentsReady: boolean;
};

export async function getParentPaymentsAddonStatus(
  tenantId: string,
): Promise<ParentPaymentsAddonStatus> {
  const client = createPlatformClient();
  const [addonRes, providerRes] = await Promise.all([
    client
      .from("tenant_addons")
      .select("enabled, enabled_at")
      .eq("tenant_id", tenantId)
      .eq("addon_key", "parent_payments")
      .maybeSingle(),
    client
      .from("tenant_payment_providers")
      .select("tenant_id")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  return {
    enabled: Boolean(addonRes.data?.enabled),
    enabledAt: (addonRes.data?.enabled_at as string | null) ?? null,
    paymentsReady: Boolean(providerRes.data),
  };
}

export async function setParentPaymentsAddonEnabled(input: {
  tenantId: string;
  enabled: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = createPlatformClient();
  const now = new Date().toISOString();
  const { error } = await client.from("tenant_addons").upsert({
    tenant_id: input.tenantId,
    addon_key: "parent_payments",
    enabled: input.enabled,
    enabled_at: input.enabled ? now : null,
    updated_at: now,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
