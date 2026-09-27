import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";

export type TenantStatusAction =
  | "suspend"
  | "reactivate"
  | "mark_past_due"
  | "mark_active";

/**
 * Why a school is suspended. `delinquency` keeps access readable during a grace
 * window (payment reminder, then read-only); `manual` is read-only immediately
 * (an ops hold — abuse, migration, dispute, request). Drives the admin-facing
 * message, so it must be captured at suspend time.
 */
export type SuspendReason = "delinquency" | "manual";

/** Grace applied to a delinquency suspension before access becomes read-only. */
export const DELINQUENCY_GRACE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The only statuses Ops may set manually from the School page. `demo`,
 * `demo_expired`, `trial` and `trial_expired` are lifecycle-driven (set by the
 * demo/trial clocks and payment webhooks), never by hand.
 */
const STATUS_BY_ACTION: Record<TenantStatusAction, string> = {
  suspend: "suspended",
  reactivate: "active",
  mark_past_due: "past_due",
  mark_active: "active",
};

export function isManualStatusAction(value: string): value is TenantStatusAction {
  return value in STATUS_BY_ACTION;
}

/**
 * Ops suspends by hand, so the default (and only ops-supplied reason) is
 * `manual`. `delinquency` is reserved for the billing system: it stamps the
 * reason directly with the grace window, never through this action.
 */
export function parseSuspendReason(value: string | null | undefined): SuspendReason {
  return value === "delinquency" ? "delinquency" : "manual";
}

/**
 * Set a tenant lifecycle status by hand. Only the manual subset is allowed —
 * trial/demo transitions stay automated. `suspended` blocks writes; `active`
 * restores them.
 *
 * Suspension records *why* and, for delinquency, *when* access becomes
 * read-only. Reactivation clears the suspension stamps so a later suspension
 * starts clean.
 */
export async function setTenantStatus(input: {
  tenantId: string;
  action: TenantStatusAction;
  /** Required for `suspend`; ignored otherwise. */
  reason?: SuspendReason;
}): Promise<
  | {
      ok: true;
      status: string;
      previousStatus: string | null;
      suspendReason: SuspendReason | null;
      readOnlyAt: string | null;
    }
  | { ok: false; error: string }
> {
  const nextStatus = STATUS_BY_ACTION[input.action];
  const client = createPlatformClient();
  const now = new Date();

  const { data: existing, error: readError } = await client
    .from("tenants")
    .select("status")
    .eq("id", input.tenantId)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: readError.message };
  }
  if (!existing) {
    return { ok: false, error: "School not found." };
  }

  let suspendReason: SuspendReason | null = null;
  let readOnlyAt: string | null = null;
  const patch: Record<string, string | null> = {
    status: nextStatus,
    updated_at: now.toISOString(),
  };

  if (input.action === "suspend") {
    suspendReason = input.reason ?? "delinquency";
    patch.suspend_reason = suspendReason;
    patch.suspended_at = now.toISOString();
    patch.suspended_grace_ends_at =
      suspendReason === "delinquency"
        ? new Date(now.getTime() + DELINQUENCY_GRACE_DAYS * DAY_MS).toISOString()
        : null;
    readOnlyAt = patch.suspended_grace_ends_at;
  } else {
    // Reactivate / mark_* clears any suspension stamps.
    patch.suspend_reason = null;
    patch.suspended_at = null;
    patch.suspended_grace_ends_at = null;
  }

  const { data, error } = await client
    .from("tenants")
    .update(patch)
    .eq("id", input.tenantId)
    .select("status")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "School not found." };
  }

  return {
    ok: true,
    status: data.status as string,
    previousStatus: (existing.status as string | null) ?? null,
    suspendReason,
    readOnlyAt,
  };
}
