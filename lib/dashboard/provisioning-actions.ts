"use server";

import { getPlatformSession } from "@/lib/auth/session";
import { writeTenantOpsAudit } from "@/lib/platform/ops-audit";
import {
  addSchoolAdministrator,
  createDemoTenant,
  previewSchool,
  type CreateDemoTenantResult,
  type SchoolPreviewResult,
} from "@/lib/platform/provisioning";

export type PreviewState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "ok"; data: Extract<SchoolPreviewResult, { ok: true }> };

export type CreateState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "ok"; data: Extract<CreateDemoTenantResult, { ok: true }> };

/**
 * Ops-only SABER lookup for the guided-demo wizard. Runs server-side so the
 * shared provisioning secret never reaches the browser.
 */
export async function previewSchoolAction(
  country: string,
  schoolCode: string,
): Promise<PreviewState> {
  const { user } = await getPlatformSession();
  if (!user) {
    return { status: "error", error: "Su sesión expiró. Vuelva a iniciar sesión." };
  }

  const result = await previewSchool(country.trim(), schoolCode.trim());
  if (!result.ok) {
    return { status: "error", error: result.error };
  }
  return { status: "ok", data: result };
}

export type CreateDemoTenantActionInput = {
  country: string;
  schoolCode: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminRole?: string;
  name?: string;
};

/** Creates the school space + admin (pending_first_login) for a guided demo. */
export async function createDemoTenantAction(
  input: CreateDemoTenantActionInput,
): Promise<CreateState> {
  const { user } = await getPlatformSession();
  if (!user) {
    return { status: "error", error: "Su sesión expiró. Vuelva a iniciar sesión." };
  }

  const result = await createDemoTenant({
    country: input.country.trim(),
    schoolCode: input.schoolCode.trim(),
    adminFirstName: input.adminFirstName.trim(),
    adminLastName: input.adminLastName.trim(),
    adminEmail: input.adminEmail.trim(),
    adminRole: input.adminRole?.trim() || undefined,
    name: input.name?.trim() || undefined,
  });

  if (!result.ok) {
    return { status: "error", error: result.error };
  }
  return { status: "ok", data: result };
}

export type AddAdministratorState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "ok"; email: string };

/** Ops-only: add an administrator to an existing school. */
export async function addAdministratorAction(input: {
  tenantId: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
}): Promise<AddAdministratorState> {
  const { user, sessionUser } = await getPlatformSession();
  if (!user) {
    return { status: "error", error: "Su sesión expiró. Vuelva a iniciar sesión." };
  }

  const tenantId = input.tenantId.trim();
  const result = await addSchoolAdministrator({
    tenantId,
    adminFirstName: input.adminFirstName.trim(),
    adminLastName: input.adminLastName.trim(),
    adminEmail: input.adminEmail.trim(),
  });

  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  await writeTenantOpsAudit({
    tenantId,
    actor: { userId: user.id, email: sessionUser?.email ?? null },
    action: "admin.added",
    target: result.email,
    beforeValue: null,
    afterValue: { email: result.email },
  });

  return { status: "ok", email: result.email };
}
