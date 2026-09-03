import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";
import type { Profile, Tenant, TenantMetrics } from "@/lib/domain";

const platformConfigured = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Skeleton aggregator the dashboard will call. It is intentionally small:
 * production counting of students/teachers/classes/enrollments per tenant
 * should actually be done as a single SQL view / RPC over the shared schema
 * (owned by `weeon-admin`) rather than N+1 client queries. That work is
 * tracked in docs/data-model.md under "Planned platform aggregation".
 */
export async function listTenantsForDashboard(): Promise<
  { tenants: TenantMetrics[]; reason?: string }
> {
  if (!platformConfigured()) {
    return {
      tenants: [],
      reason: "Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    };
  }

  const client = createPlatformClient();

  const [{ data: tenants, error: tenantError }, { data: profiles }] =
    await Promise.all([
      client.from("tenants").select("*").order("created_at", { ascending: false }),
      client.from("profiles").select("tenant_id").limit(10000),
    ]);

  if (tenantError) {
    throw new Error(`Platform read of tenants failed: ${tenantError.message}`);
  }

  const countsByTenant = countProfilesByTenant(profiles ?? []);

  return {
    tenants: (tenants ?? []).map((tenant) =>
      toMetrics(tenant as Tenant, countsByTenant.get(tenant.id) ?? 0),
    ),
  };
}

function countProfilesByTenant(profiles: Pick<Profile, "tenant_id">[]) {
  const map = new Map<string, number>();
  for (const p of profiles) {
    map.set(p.tenant_id, (map.get(p.tenant_id) ?? 0) + 1);
  }
  return map;
}

function toMetrics(tenant: Tenant, profiles: number): TenantMetrics {
  const seats = typeof tenant.billing_seats === "number" ? tenant.billing_seats : null;
  const status = tenant.status;
  return {
    tenant,
    counts: {
      profiles,
      students: 0,
      teachers: 0,
      parents: 0,
      classes: 0,
      enrollments: 0,
    },
    seatUsage: {
      billingSeats: seats,
      seatedProfiles: profiles,
      utilizationPct:
        seats && seats > 0 ? Math.round((profiles / seats) * 100) : null,
    },
    flags: {
      isTrial: status === "trial",
      isPastDue: status === "past_due",
      isSuspended: status === "suspended",
      hasBackupWithin: false,
    },
  };
}
