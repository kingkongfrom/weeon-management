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

export type ProvisionSchoolRosterResult =
  | {
      ok: true;
      created: number;
      linked: number;
      emailed: number;
      offline: number;
      errors: string[];
    }
  | ProvisioningUnavailable;

/** Ask the school ERP to open roster logins after a school becomes active. */
export async function provisionSchoolRoster(
  tenantId: string,
): Promise<ProvisionSchoolRosterResult> {
  return post<ProvisionSchoolRosterResult>("/api/ops/schools/provision-roster", {
    tenantId,
  });
}

/** Generic, user-safe failure text; technical detail stays on the server. */
const GENERIC_FAILURE =
  "No pudimos completar la operación. Intente de nuevo en unos minutos.";

/**
 * Deployment fault (missing/invalid env). Kept distinct from GENERIC_FAILURE so
 * Ops staff see "contact engineering" instead of retrying a school code that was
 * never looked up. See docs/provisioning.md.
 */
const NOT_CONFIGURED =
  "La incorporación no está configurada en este entorno. Avisar al equipo técnico.";

async function post<T>(path: string, body: unknown): Promise<T> {
  const origin = provisioningOrigin();
  const secret = provisioningSecret();
  if (!origin || !secret) {
    console.error(
      "[provisioning] not configured: set WEEON_APP_ORIGIN and OPS_PROVISIONING_SECRET",
    );
    return { ok: false, error: NOT_CONFIGURED } as T;
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
      // 401/403 means the shared secret does not match weeon-tenants, which is a
      // deployment fault, not a bad school code.
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: NOT_CONFIGURED } as T;
      }
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

/** Shared plumbing for the GET/DELETE calls the onboarding data flow needs. */
async function call<T>(
  method: "GET" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const origin = provisioningOrigin();
  const secret = provisioningSecret();
  if (!origin || !secret) {
    console.error(
      "[provisioning] not configured: set WEEON_APP_ORIGIN and OPS_PROVISIONING_SECRET",
    );
    return { ok: false, error: NOT_CONFIGURED } as T;
  }

  try {
    const res = await fetch(`${origin}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      console.error(
        `[provisioning] ${method} ${path} failed (${res.status}):`,
        payload?.error ?? "no error body",
      );
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: NOT_CONFIGURED } as T;
      }
      return { ok: false, error: payload?.error ?? GENERIC_FAILURE } as T;
    }

    const payload = (await res.json()) as Record<string, unknown>;
    return { ok: true, ...payload } as T;
  } catch (err) {
    console.error(`[provisioning] ${method} ${path} request error:`, err);
    return { ok: false, error: GENERIC_FAILURE } as T;
  }
}

// ── Onboarding data (school → Weeon file handover) ───────────────────────────
// Design: `weeon-tenants/docs/school-import.md` → "Build spec: the school-side
// upload link".

export type UploadLinkState = "open" | "used" | "expired" | "revoked" | "exhausted";

export type OnboardingUploadLink = {
  id: string;
  tenantId: string;
  schoolName: string;
  label: string | null;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  uploadCount: number;
  maxUploads: number;
  state: UploadLinkState;
};

export type OnboardingUploadFile = {
  id: string;
  linkId: string;
  fileName: string;
  byteSize: number;
  sha256: string;
  uploadedAt: string;
};

export type OnboardingUploadView = {
  links: OnboardingUploadLink[];
  files: OnboardingUploadFile[];
};

/** Links minted for one school, plus the files it has sent. */
export async function listOnboardingUploads(
  tenantId: string,
): Promise<(OnboardingUploadView & { ok: true }) | ProvisioningUnavailable> {
  return call<OnboardingUploadView & { ok: true }>(
    "GET",
    `/api/ops/onboarding/upload-links?tenantId=${encodeURIComponent(tenantId)}`,
  );
}

/** Mints a link. The returned `url` is the only time the token exists in clear. */
export async function createOnboardingUploadLink(input: {
  tenantId: string;
  label?: string | null;
}): Promise<
  | { ok: true; linkId: string; url: string; expiresAt: string }
  | ProvisioningUnavailable
> {
  return post("/api/ops/onboarding/upload-links", input);
}

export async function revokeOnboardingUploadLink(
  linkId: string,
): Promise<{ ok: true } | ProvisioningUnavailable> {
  return call("DELETE", "/api/ops/onboarding/upload-links", { linkId });
}
