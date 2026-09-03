// Domain types for Weeon Management.
//
// These mirror the LIVE shared Supabase schema owned by `weeon-admin`
// (see that repo's lib/supabase/database.types.ts and supabase/migrations/).
//
// Weeon Management reads these tables from the PLATFORM scope via the
// service-role client — NOT through the tenant-scoped RLS used by `weeon-admin`.
// Do not add columns here that contradict the admin-owned schema. Schema
// changes in `weeon-admin` stay additive and are the source of truth.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TenantStatus =
  | "trial"
  | "active"
  | "past_due"
  | "suspended";

export type TenantPlan = "trial" | "pro";

/** Institution / tenant row (public.tenants). */
export interface Tenant {
  id: string;
  name: string;
  status: string;
  plan: string;
  subdomain: string;
  slug: string | null;
  saber_code: string | null;
  settings: Json;
  billing_seats: number;
  subscription_id: string | null;
  greenpay_subscription_id: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  paid_at: string | null;
  paid_until: string | null;
  created_at: string;
  updated_at: string;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Paid seat count from `billing_seats`, falling back to `settings.billingSeats`. */
export function resolveBillingSeats(
  tenant: Pick<Tenant, "billing_seats" | "settings">,
): number {
  const column = asFiniteNumber(tenant.billing_seats);
  if (column !== null) return column;

  const settings = tenant.settings;
  if (settings && typeof settings === "object" && !Array.isArray(settings)) {
    const fromSettings = asFiniteNumber(settings.billingSeats);
    if (fromSettings !== null) return fromSettings;
  }

  return 0;
}

export type EducationLevelKey =
  | "primaria"
  | "secundaria"
  | "preescolar"
  | "tecnico";

const EDUCATION_LEVEL_LABELS: Record<EducationLevelKey, string> = {
  primaria: "Primary",
  secundaria: "Secondary",
  preescolar: "Preschool",
  tecnico: "Technical",
};

function settingsObject(
  settings: Json,
): Record<string, Json | undefined> | null {
  if (settings && typeof settings === "object" && !Array.isArray(settings)) {
    return settings as Record<string, Json | undefined>;
  }
  return null;
}

function resolveCalendarSystemKey(settings: Json): string {
  const obj = settingsObject(settings);
  const raw = obj?.calendarSystem;
  if (typeof raw === "string" && raw.trim()) return raw.trim().toLowerCase();

  const offer = obj?.schoolOffer;
  if (offer && typeof offer === "object" && !Array.isArray(offer)) {
    const offerObj = offer as Record<string, Json | undefined>;
    if (offerObj.differentiatedSchedule === true) return "private_trimester";
    if (offerObj.nationalSchedule === true) return "mep";
  }

  return "mep";
}

const CALENDAR_PROGRAM_LABELS: Record<string, string> = {
  mep: "MEP",
  ais: "AIS",
  private_trimester: "Private",
  private_semester: "Private",
  other: "Other",
};

/** e.g. `MEP - Semester` — program plus trimester/semester structure. */
export function resolveSchoolCalendarStructure(settings: Json): string {
  const key = resolveCalendarSystemKey(settings);
  const program = CALENDAR_PROGRAM_LABELS[key] ?? key.toUpperCase();
  const structure =
    key === "mep" || key === "private_semester" ? "Semester" : "Trimester";
  return `${program} - ${structure}`;
}

/** Paid-member start date; trials are not counted as membership. */
export function resolveMemberSince(
  tenant: Pick<Tenant, "status" | "paid_at">,
): string {
  if (tenant.status === "trial") return "—";
  return formatTenantTimestamp(tenant.paid_at);
}

export function formatTenantTimestamp(iso?: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 16).replace("T", " ") : "—";
}

/** Calendar date for tenant-facing labels (no time). */
export function formatTenantDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Enabled add-ons from `settings.modules` (Core, Finance, Transport). */
export function resolveTenantModules(settings: Json): string {
  const obj = settingsObject(settings);
  const modules = obj?.modules;
  if (!modules || typeof modules !== "object" || Array.isArray(modules)) {
    return "Core";
  }

  const flags = modules as Record<string, Json | undefined>;
  const enabled: string[] = [];
  if (flags.core !== false) enabled.push("Core");
  if (flags.finance === true) enabled.push("Finance");
  if (flags.transport === true) enabled.push("Transport");
  return enabled.length > 0 ? enabled.join(", ") : "—";
}

/** School year label from `settings.academicYear` (e.g. 2026-2027). */
export function resolveAcademicYearLabel(settings: Json): string {
  const obj = settingsObject(settings);
  const raw = obj?.academicYear;
  if (typeof raw !== "string" || !raw.trim()) return "—";

  const match = raw.trim().match(/^(\d{4})/);
  if (match) {
    const start = Number(match[1]);
    return `${start}-${start + 1}`;
  }
  return raw.trim();
}

/** Whole days until `trial_ends_at`; negative if expired. */
export function trialDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export function formatTrialEndsHint(trialEndsAt: string | null): string | undefined {
  const days = trialDaysRemaining(trialEndsAt);
  if (days === null) return undefined;
  if (days < 0) return "Trial expired";
  if (days === 0) return "Ends today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

/** Primary, secondary, etc. from `settings.educationLevels` and `settings.schoolOffer`. */
export function resolveEducationLevelFlags(
  settings: Json,
): Record<EducationLevelKey, boolean> {
  const flags: Record<EducationLevelKey, boolean> = {
    primaria: false,
    secundaria: false,
    preescolar: false,
    tecnico: false,
  };

  const obj = settingsObject(settings);
  if (!obj) return flags;

  const levels = obj.educationLevels;
  if (Array.isArray(levels)) {
    for (const item of levels) {
      if (typeof item === "string") {
        const key = item.trim().toLowerCase();
        if (key in flags) flags[key as EducationLevelKey] = true;
      }
    }
  }

  const offer = obj.schoolOffer;
  if (offer && typeof offer === "object" && !Array.isArray(offer)) {
    const offerObj = offer as Record<string, Json | undefined>;
    for (const key of Object.keys(flags) as EducationLevelKey[]) {
      if (offerObj[key] === true) flags[key] = true;
    }
  }

  return flags;
}

/** Human-readable enabled education levels. */
export function formatEducationLevels(settings: Json): string {
  const flags = resolveEducationLevelFlags(settings);
  const active = (Object.keys(flags) as EducationLevelKey[])
    .filter((key) => flags[key])
    .map((key) => EDUCATION_LEVEL_LABELS[key]);
  return active.length > 0 ? active.join(", ") : "—";
}

/** MEP grade bands per cycle (Costa Rica national calendar). */
const PRIMARY_SCHOOL_CYCLES: ReadonlyArray<{ label: string; grades: number[] }> =
  [
    { label: "I Ciclo", grades: [1, 2, 3] },
    { label: "II Ciclo", grades: [4, 5, 6] },
  ];

const SECONDARY_SCHOOL_CYCLES: ReadonlyArray<{ label: string; grades: number[] }> =
  [
    { label: "III Ciclo", grades: [7, 8, 9] },
    { label: "IV Ciclo", grades: [10, 11, 12] },
  ];

function parseSchoolOfferGrades(settings: Json): Set<number> {
  const grades = new Set<number>();
  const obj = settingsObject(settings);
  const offer = obj?.schoolOffer;
  if (!offer || typeof offer !== "object" || Array.isArray(offer)) return grades;

  const arr = (offer as Record<string, Json | undefined>).grades;
  if (!Array.isArray(arr)) return grades;

  for (const grade of arr) {
    const parsed = asFiniteNumber(grade);
    if (parsed !== null) grades.add(parsed);
  }
  return grades;
}

function formatSchoolCycles(
  cycles: ReadonlyArray<{ label: string; grades: number[] }>,
  enabled: boolean,
  grades: Set<number>,
): string {
  if (!enabled) return "—";

  if (grades.size === 0) {
    return cycles.map((cycle) => cycle.label).join(", ");
  }

  const active = cycles
    .filter((cycle) => cycle.grades.some((grade) => grades.has(grade)))
    .map((cycle) => cycle.label);

  return active.length > 0 ? active.join(", ") : "—";
}

/** Enabled MEP primary cycles from `schoolOffer.grades` (I / II Ciclo). */
export function resolvePrimarySchoolCycles(settings: Json): string {
  const flags = resolveEducationLevelFlags(settings);
  return formatSchoolCycles(
    PRIMARY_SCHOOL_CYCLES,
    flags.primaria,
    parseSchoolOfferGrades(settings),
  );
}

/** Enabled MEP secondary cycles from `schoolOffer.grades` (III / IV Ciclo). */
export function resolveSecondarySchoolCycles(settings: Json): string {
  const flags = resolveEducationLevelFlags(settings);
  return formatSchoolCycles(
    SECONDARY_SCHOOL_CYCLES,
    flags.secundaria,
    parseSchoolOfferGrades(settings),
  );
}

/** School admin contact shown on tenant detail. */
export interface TenantAdminContact {
  name: string;
  email: string;
}

/** Prefer auth email, then contact email on a profile row. */
export function resolveProfileEmail(
  profile: Pick<Profile, "email" | "auth_email">,
): string {
  const authEmail = profile.auth_email?.trim();
  if (authEmail) return authEmail;
  return profile.email?.trim() ?? "";
}

/** A person profile row (public.profiles). Users per tenant = count(*) grouped by tenant_id. */
export interface Profile {
  id: string;
  tenant_id: string;
  role: string;
  account_status: string;
  active: boolean;
  name: string;
  username: string | null;
  email: string;
  auth_email: string | null;
  email_sent_at: string | null;
  first_login_at: string | null;
  provisioned_at: string | null;
  created_at: string;
}

/** Aggregated per-tenant view shown in the dashboard. */
export interface TenantMetrics {
  tenant: Tenant;
  counts: {
    profiles: number;
    students: number;
    teachers: number;
    parents: number;
    classes: number;
    enrollments: number;
  };
  seatUsage: {
    billingSeats: number | null;
    seatedProfiles: number;
    utilizationPct: number | null;
  };
  flags: {
    isTrial: boolean;
    isPastDue: boolean;
    isSuspended: boolean;
    hasBackupWithin: boolean;
  };
}
