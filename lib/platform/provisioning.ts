import "server-only";

/**
 * Client for the school-provisioning API owned by `weeon-tenants`.
 *
 * Weeon Ops owns the onboarding UI, but the schema + MEP catalog live in
 * `weeon-tenants`. Creating a demo school therefore calls these routes with a
 * shared secret (`OPS_PROVISIONING_SECRET`); the service-role key never leaves
 * this server. See `weeon-tenants/lib/ops/create-demo-tenant.ts`.
 */

function provisioningOrigin(): string | null {
  const raw = process.env.WEEON_APP_ORIGIN?.trim();
  return raw ? raw.replace(/\/+$/, "") : null;
}

function provisioningSecret(): string | null {
  const secret = process.env.OPS_PROVISIONING_SECRET?.trim();
  return secret && secret.length >= 16 ? secret : null;
}

export type ProvisioningUnavailable = { ok: false; error: string };

export type SchoolCatalogPreview = {
  saberCode: string;
  name: string;
  status: string;
  regionalOffice: string;
  circuit: string;
  locationLabel: string;
  address: string;
  accreditedOffer: string;
  phones: string[];
  emails: string[];
  specialPrograms: string[];
  scheduleLabel: string;
  cycleLabels: string[];
  gradeLabels: string[];
};

export type SchoolPreviewResult =
  | { ok: true; preview: SchoolCatalogPreview; alreadyClaimed: boolean }
  | ProvisioningUnavailable;

export async function previewSchool(
  country: string,
  schoolCode: string,
): Promise<SchoolPreviewResult> {
  return post<SchoolPreviewResult>("/api/ops/schools/preview", {
    country,
    schoolCode,
  });
}

export type CreateDemoTenantInput = {
  country: string;
  schoolCode: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminRole?: string;
  name?: string;
};

export type CreateDemoTenantResult =
  | {
      ok: true;
      tenantId: string;
      tenantName: string;
      slug: string;
      demoEndsAt: string;
      adminEmail: string;
    }
  | ProvisioningUnavailable;

export async function createDemoTenant(
  input: CreateDemoTenantInput,
): Promise<CreateDemoTenantResult> {
  return post<CreateDemoTenantResult>("/api/ops/schools/create", input);
}

export type AddSchoolAdministratorInput = {
  tenantId: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
};

export type AddSchoolAdministratorResult =
  | { ok: true; userId: string; email: string }
  | ProvisioningUnavailable;

export async function addSchoolAdministrator(
  input: AddSchoolAdministratorInput,
): Promise<AddSchoolAdministratorResult> {
  return post<AddSchoolAdministratorResult>(
    "/api/ops/schools/administrators",
    input,
  );
}

export type ExtendDemoWindowInput = {
  tenantId: string;
  extraDays: number;
};

export type ExtendDemoWindowResult =
  | {
      ok: true;
      demoEndsAt: string;
      previousDemoEndsAt: string | null;
    }
  | ProvisioningUnavailable;

export async function extendDemoWindow(
  input: ExtendDemoWindowInput,
): Promise<ExtendDemoWindowResult> {
  return post<ExtendDemoWindowResult>("/api/ops/schools/demo-window", input);
}

/** Generic, user-safe failure text; technical detail stays on the server. */
const GENERIC_FAILURE =
  "No pudimos completar la operación. Intente de nuevo en unos minutos.";

async function post<T>(path: string, body: unknown): Promise<T> {
  const origin = provisioningOrigin();
  const secret = provisioningSecret();
  if (!origin || !secret) {
    console.error(
      "[provisioning] not configured: set WEEON_APP_ORIGIN and OPS_PROVISIONING_SECRET",
    );
    return { ok: false, error: GENERIC_FAILURE } as T;
  }

  try {
    const res = await fetch(`${origin}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      console.error(
        `[provisioning] ${path} failed (${res.status}):`,
        payload?.error ?? "no error body",
      );
      // The ERP returns safe, user-facing Spanish messages for validation and
      // business-rule failures (bad code, already claimed, etc.).
      return { ok: false, error: payload?.error ?? GENERIC_FAILURE } as T;
    }

    const payload = (await res.json()) as Record<string, unknown>;
    return { ok: true, ...payload } as T;
  } catch (err) {
    console.error(`[provisioning] ${path} request error:`, err);
    return { ok: false, error: GENERIC_FAILURE } as T;
  }
}
