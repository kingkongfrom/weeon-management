"use server";

import { revalidatePath } from "next/cache";
import { getPlatformSession } from "@/lib/auth/session";
import { createPlatformClient } from "@/lib/supabase/platform";

export type RemoveAdministratorState = { ok?: string; error?: string } | null;

/**
 * Revoke a school administrator from a tenant at the request of the school.
 *
 * Deletes the tenant `profiles` row (the school's admin identity) so the person
 * loses all access to that tenant's data — RLS resolves the tenant/role from
 * this row, so removing it is a hard revoke. We intentionally do NOT touch
 * `auth.users`: the same login may administer another tenant.
 *
 * Guards: ops-staff session only, tenant must match, and the last remaining
 * administrator cannot be removed (avoid locking a school out). Every removal
 * is recorded in `tenant_admin_log` (service-role only audit).
 */
export async function removeTenantAdministratorAction(
  _prev: RemoveAdministratorState,
  formData: FormData,
): Promise<RemoveAdministratorState> {
  const { user } = await getPlatformSession();
  if (!user) {
    return { error: "Your session expired. Sign in again." };
  }

  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const profileId = String(formData.get("profileId") ?? "").trim();
  if (!tenantId || !profileId) {
    return { error: "Missing tenant or administrator." };
  }

  const client = createPlatformClient();

  const { data: profile, error: readError } = await client
    .from("profiles")
    .select("id, tenant_id, role, name, email, auth_email")
    .eq("id", profileId)
    .maybeSingle();

  if (readError) {
    return { error: "Could not read that administrator." };
  }
  if (!profile || profile.tenant_id !== tenantId || profile.role !== "admin") {
    return { error: "That administrator was not found for this school." };
  }

  const { count, error: countError } = await client
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("role", "admin");

  if (countError) {
    return { error: "Could not verify the other administrators." };
  }
  if ((count ?? 0) <= 1) {
    return { error: "You cannot remove the last administrator of a school." };
  }

  const { error: deleteError } = await client
    .from("profiles")
    .delete()
    .eq("id", profileId)
    .eq("tenant_id", tenantId)
    .eq("role", "admin");

  if (deleteError) {
    return { error: `Could not remove the administrator: ${deleteError.message}` };
  }

  await client.from("tenant_admin_log").insert({
    tenant_id: tenantId,
    admin_user_id: profileId,
    provision_kind: "removed",
  });

  revalidatePath(`/dashboard/tenants/${tenantId}`);
  return { ok: "Administrator removed." };
}
