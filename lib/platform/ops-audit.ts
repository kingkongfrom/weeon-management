import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";

export type TenantOpsAction =
  | "admin.added"
  | "admin.removed"
  | "admin.suspended"
  | "admin.reactivated"
  | "admin.deleted"
  | "module.enabled"
  | "module.disabled"
  | "status.suspend"
  | "status.reactivate"
  | "status.past_due"
  | "status.active";

export type OpsAuditActor = {
  userId: string;
  email: string | null;
};

export type TenantOpsAuditEntry = {
  id: string;
  action: string;
  target: string | null;
  actorEmail: string | null;
  beforeValue: unknown;
  afterValue: unknown;
  createdAt: string;
};

/**
 * Append an ops audit row. Best-effort: an audit failure must never block the
 * underlying action, so callers log the result but do not abort on error.
 */
export async function writeTenantOpsAudit(input: {
  tenantId: string;
  actor: OpsAuditActor;
  action: TenantOpsAction;
  target?: string | null;
  beforeValue?: unknown;
  afterValue?: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = createPlatformClient();
  const { error } = await client.from("tenant_ops_audit").insert({
    tenant_id: input.tenantId,
    actor_user_id: input.actor.userId || null,
    actor_email: input.actor.email || null,
    action: input.action,
    target: input.target ?? null,
    before_value: (input.beforeValue ?? null) as never,
    after_value: (input.afterValue ?? null) as never,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Recent ops audit entries for a tenant, newest first. */
export async function listTenantOpsAudit(
  tenantId: string,
  limit = 25,
): Promise<TenantOpsAuditEntry[]> {
  const client = createPlatformClient();
  const { data, error } = await client
    .from("tenant_ops_audit")
    .select("id, action, target, actor_email, before_value, after_value, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    action: row.action as string,
    target: (row.target as string | null) ?? null,
    actorEmail: (row.actor_email as string | null) ?? null,
    beforeValue: row.before_value,
    afterValue: row.after_value,
    createdAt: row.created_at as string,
  }));
}
