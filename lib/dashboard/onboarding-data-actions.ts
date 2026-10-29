"use server";

import { getPlatformSession } from "@/lib/auth/session";
import { writeTenantOpsAudit } from "@/lib/platform/ops-audit";
import {
  createOnboardingUploadLink,
  listOnboardingUploads,
  revokeOnboardingUploadLink,
  sendOnboardingUploadLink,
  type OnboardingUploadView,
} from "@/lib/platform/provisioning";

/**
 * Ops side of the school data handover.
 *
 * The shared secret and the token stay on the server: the browser only ever
 * receives the URL to forward to the school, and only once, at creation.
 * Design: `weeon-tenants/docs/school-import.md`.
 */

export type OnboardingDataState =
  | { status: "error"; error: string }
  | { status: "ok"; view: OnboardingUploadView };

export type CreateLinkState =
  | { status: "error"; error: string }
  | { status: "ok"; url: string; expiresAt: string; linkId: string };

export async function loadOnboardingUploads(
  tenantId: string,
): Promise<OnboardingDataState> {
  const { user } = await getPlatformSession();
  if (!user) {
    return { status: "error", error: "Su sesión expiró. Vuelva a iniciar sesión." };
  }

  const result = await listOnboardingUploads(tenantId);
  if (!result.ok) return { status: "error", error: result.error };
  return { status: "ok", view: { links: result.links, files: result.files } };
}

export async function createUploadLinkAction(input: {
  tenantId: string;
  label?: string | null;
}): Promise<CreateLinkState> {
  const { user, sessionUser } = await getPlatformSession();
  if (!user) {
    return { status: "error", error: "Su sesión expiró. Vuelva a iniciar sesión." };
  }

  const result = await createOnboardingUploadLink({
    tenantId: input.tenantId,
    label: input.label?.trim() || null,
  });
  if (!result.ok) return { status: "error", error: result.error };

  // Minting a link grants access to a school's roster: it must be traceable.
  await writeTenantOpsAudit({
    tenantId: input.tenantId,
    actor: { userId: user.id, email: sessionUser?.email ?? null },
    action: "data.link_created",
    target: result.linkId,
    beforeValue: null,
    afterValue: { label: input.label ?? null, expiresAt: result.expiresAt },
  });

  return {
    status: "ok",
    url: result.url,
    expiresAt: result.expiresAt,
    linkId: result.linkId,
  };
}

export async function revokeUploadLinkAction(input: {  tenantId: string;
  linkId: string;
}): Promise<{ status: "ok" } | { status: "error"; error: string }> {
  const { user, sessionUser } = await getPlatformSession();
  if (!user) {
    return { status: "error", error: "Su sesión expiró. Vuelva a iniciar sesión." };
  }

  const result = await revokeOnboardingUploadLink(input.linkId);
  if (!result.ok) return { status: "error", error: result.error };

  await writeTenantOpsAudit({
    tenantId: input.tenantId,
    actor: { userId: user.id, email: sessionUser?.email ?? null },
    action: "data.link_revoked",
    target: input.linkId,
    beforeValue: null,
    afterValue: null,
  });

  return { status: "ok" };
}

/**
 * Emails the freshly minted link from the server with Weeon's letter.
 *
 * Replaces the old `mailto:` handoff, which opened the operator's own mail
 * client: the school should receive the approved message from us, and the link
 * should not sit in a personal outbox.
 */
export async function sendUploadLinkAction(input: {
  tenantId: string;
  linkId: string;
  to: string;
  schoolName: string;
  uploadUrl: string;
  expiresAt: string;
  note?: string | null;
}): Promise<{ status: "ok" } | { status: "error"; error: string }> {
  const { user, sessionUser } = await getPlatformSession();
  if (!user) {
    return { status: "error", error: "Su sesión expiró. Vuelva a iniciar sesión." };
  }

  const result = await sendOnboardingUploadLink({
    to: input.to,
    schoolName: input.schoolName,
    uploadUrl: input.uploadUrl,
    expiresAt: input.expiresAt,
    note: input.note ?? null,
  });
  if (!result.ok) return { status: "error", error: result.error };

  await writeTenantOpsAudit({
    tenantId: input.tenantId,
    actor: { userId: user.id, email: sessionUser?.email ?? null },
    action: "data.link_sent",
    target: input.linkId,
    beforeValue: null,
    afterValue: { emailedTo: input.to.trim().toLowerCase() },
  });

  return { status: "ok" };
}
