import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";
import type {
  Profile,
  Tenant,
  TenantAdminContact,
  TenantMetrics,
  TenantRosterCounts,
} from "@/lib/domain";
import { resolveBillingSeats, resolveProfileEmail } from "@/lib/domain";

const platformConfigured = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Row shape of `public.platform_tenant_metrics` (owned by `weeon-tenants`). */
type PlatformMetricsRow = {
  tenant_id: string;
  profiles: number | string;
  admins: number | string;
  teacher_users: number | string;
  student_users: number | string;
  parent_users: number | string;
  students: number | string;
  teachers: number | string;
  classes: number | string;
  enrollments: number | string;
};

function asCount(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function toRosterCounts(row: PlatformMetricsRow): TenantRosterCounts {
  return {
    tenantId: row.tenant_id,
    profiles: asCount(row.profiles),
    admins: asCount(row.admins),
    teacherUsers: asCount(row.teacher_users),
    studentUsers: asCount(row.student_users),
    parentUsers: asCount(row.parent_users),
    students: asCount(row.students),
    teachers: asCount(row.teachers),
    classes: asCount(row.classes),
    enrollments: asCount(row.enrollments),
  };
}

/** Lists every tenant row — no profile/user aggregation. */
export async function listTenants(): Promise<{
  tenants: Tenant[];
  reason?: string;
}> {
  if (!platformConfigured()) {
    return {
      tenants: [],
      reason: "Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    };
  }

  const client = createPlatformClient();
  const { data: tenants, error } = await client
    .from("tenants")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Platform read of tenants failed: ${error.message}`);
  }

  return { tenants: (tenants ?? []) as Tenant[] };
}

/**
 * Per-tenant roster roll-up for every school, keyed by `tenant_id`.
 *
 * Reads the single `platform_tenant_metrics` view (no N+1). Degrades to an empty
 * map if the view is not deployed yet, so the console still renders. The tenant
 * `reason` is surfaced by the caller when useful.
 */
export async function listTenantMetrics(): Promise<{
  metrics: Map<string, TenantRosterCounts>;
  reason?: string;
}> {
  if (!platformConfigured()) {
    return {
      metrics: new Map(),
      reason: "Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    };
  }

  const client = createPlatformClient();
  const { data, error } = await client
    .from("platform_tenant_metrics")
    .select("*");

  if (error) {
    return {
      metrics: new Map(),
      reason: `Roster counts unavailable: ${error.message}`,
    };
  }

  const metrics = new Map<string, TenantRosterCounts>();
  for (const row of (data ?? []) as PlatformMetricsRow[]) {
    metrics.set(row.tenant_id, toRosterCounts(row));
  }
  return { metrics };
}

/** Roster roll-up for a single tenant, or null when unavailable. */
export async function getTenantRosterCounts(
  tenantId: string,
): Promise<TenantRosterCounts | null> {
  if (!platformConfigured()) return null;

  const client = createPlatformClient();
  const { data, error } = await client
    .from("platform_tenant_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return null;
  return toRosterCounts(data as PlatformMetricsRow);
}

/** School administrators (`profiles.role = admin`) for one tenant. */
export async function listTenantAdmins(tenantId: string): Promise<TenantAdminContact[]> {
  const client = createPlatformClient();
  const { data, error } = await client
    .from("profiles")
    .select("id, tenant_id, name, email, auth_email")
    .eq("tenant_id", tenantId)
    .eq("role", "admin")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Platform read of tenant admins failed: ${error.message}`);
  }

  return (data ?? []).map(toAdminContact);
}

function toAdminContact(
  profile: Pick<Profile, "id" | "name" | "email" | "auth_email">,
): TenantAdminContact {
  return {
    id: profile.id,
    name: profile.name?.trim() || "—",
    email: resolveProfileEmail(profile),
  };
}

/** Every tenant merged with its real roster counts, for the dashboard. */
export async function listTenantsForDashboard(): Promise<
  { tenants: TenantMetrics[]; reason?: string }
> {
  const { tenants, reason } = await listTenants();
  if (reason) {
    return { tenants: [], reason };
  }

  const { metrics } = await listTenantMetrics();

  return {
    tenants: tenants.map((tenant) =>
      toMetrics(tenant, metrics.get(tenant.id) ?? null),
    ),
  };
}

function toMetrics(
  tenant: Tenant,
  roster: TenantRosterCounts | null,
): TenantMetrics {
  const seats = resolveBillingSeats(tenant);
  const status = tenant.status;
  const profiles = roster?.profiles ?? 0;
  return {
    tenant,
    counts: {
      profiles,
      students: roster?.students ?? 0,
      teachers: roster?.teachers ?? 0,
      parents: roster?.parentUsers ?? 0,
      classes: roster?.classes ?? 0,
      enrollments: roster?.enrollments ?? 0,
    },
    seatUsage: {
      billingSeats: seats,
      seatedProfiles: profiles,
      utilizationPct: seats > 0 ? Math.round((profiles / seats) * 100) : null,
    },
    flags: {
      isTrial: status === "trial",
      isPastDue: status === "past_due",
      isSuspended: status === "suspended",
      hasBackupWithin: false,
    },
  };
}
