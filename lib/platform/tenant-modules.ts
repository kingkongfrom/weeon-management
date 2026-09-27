import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";

export type TenantModuleTier = "core" | "addon";

/**
 * One module row for the Ops School page.
 *
 * `core` modules are the plan minimum — always enabled and locked in the UI.
 * `addon` modules are paid and can be switched on/off by Ops.
 */
export type TenantModuleState = {
  key: string;
  label: string;
  description: string;
  tier: TenantModuleTier;
  sortOrder: number;
  enabled: boolean;
  enabledAt: string | null;
  disabledAt: string | null;
};

type CatalogRow = {
  addon_key: string;
  label: string;
  description: string;
  tier: string;
  sort_order: number;
};

type AddonRow = {
  addon_key: string;
  enabled: boolean;
  enabled_at: string | null;
  disabled_at: string | null;
};

function toTier(value: string): TenantModuleTier {
  return value === "core" ? "core" : "addon";
}

/**
 * Every catalog module for a tenant, merged with its current `tenant_addons`
 * state. Core modules with no row default to enabled (the plan minimum is
 * always on regardless of table drift).
 */
export async function listTenantModules(
  tenantId: string,
): Promise<TenantModuleState[]> {
  const client = createPlatformClient();
  const [catalogRes, addonRes] = await Promise.all([
    client
      .from("tenant_module_catalog")
      .select("addon_key, label, description, tier, sort_order")
      .order("sort_order", { ascending: true }),
    client
      .from("tenant_addons")
      .select("addon_key, enabled, enabled_at, disabled_at")
      .eq("tenant_id", tenantId),
  ]);

  const catalog = (catalogRes.data ?? []) as CatalogRow[];
  const byKey = new Map<string, AddonRow>(
    ((addonRes.data ?? []) as AddonRow[]).map((row) => [row.addon_key, row]),
  );

  return catalog.map((item) => {
    const row = byKey.get(item.addon_key);
    const tier = toTier(item.tier);
    const enabled = tier === "core" ? true : Boolean(row?.enabled);
    return {
      key: item.addon_key,
      label: item.label,
      description: item.description,
      tier,
      sortOrder: item.sort_order,
      enabled,
      enabledAt: row?.enabled_at ?? null,
      disabledAt: row?.disabled_at ?? null,
    };
  });
}

/**
 * Toggle a paid add-on for a tenant. Core modules are refused here — the plan
 * minimum cannot be switched off from Ops.
 */
export async function setTenantModuleEnabled(input: {
  tenantId: string;
  moduleKey: string;
  enabled: boolean;
}): Promise<
  | { ok: true; previousEnabled: boolean }
  | { ok: false; error: string }
> {
  const client = createPlatformClient();

  const { data: catalogRow, error: catalogError } = await client
    .from("tenant_module_catalog")
    .select("tier")
    .eq("addon_key", input.moduleKey)
    .maybeSingle();

  if (catalogError) {
    return { ok: false, error: catalogError.message };
  }
  if (!catalogRow) {
    return { ok: false, error: "Unknown module." };
  }
  if (catalogRow.tier === "core") {
    return { ok: false, error: "Core modules are always on and cannot be disabled." };
  }

  const now = new Date().toISOString();

  const { data: existing } = await client
    .from("tenant_addons")
    .select("enabled, enabled_at, disabled_at")
    .eq("tenant_id", input.tenantId)
    .eq("addon_key", input.moduleKey)
    .maybeSingle();

  const { error } = await client.from("tenant_addons").upsert(
    {
      tenant_id: input.tenantId,
      addon_key: input.moduleKey,
      enabled: input.enabled,
      enabled_at: input.enabled ? now : null,
      disabled_at: input.enabled ? null : now,
      updated_at: now,
    },
    { onConflict: "tenant_id,addon_key" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    previousEnabled: Boolean(existing?.enabled),
  };
}
