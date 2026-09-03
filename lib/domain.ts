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
