"use server";

import { createSessionClient } from "@/lib/supabase/session";
import { getPlatformSession } from "@/lib/auth/session";
import { createPlatformClient } from "@/lib/supabase/platform";
import {
  enrollTotp,
  getMfaAssurance,
  listTotpFactors,
  unenrollTotp,
  verifyTotp,
} from "@/lib/auth/mfa";

export type MfaEnrollState =
  | { ok: true; factorId: string; qrCode: string; secret: string; uri: string }
  | { ok: false; error: string }
  | null;

export type MfaSimpleState = { ok?: string; error?: string } | null;

/**
 * Start TOTP enrollment for the signed-in ops user. Returns the QR code to
 * display; the factor stays unverified until `confirmMfaEnrollmentAction`.
 */
export async function startMfaEnrollmentAction(
  _prev: MfaEnrollState,
  _formData: FormData,
): Promise<MfaEnrollState> {
  const { user, sessionUser } = await getPlatformSession();
  if (!user) return { ok: false, error: "Your session expired. Sign in again." };

  const supabase = await createSessionClient();
  const name = sessionUser?.email ?? user.email ?? "Weeon Ops";
  const result = await enrollTotp(supabase, name);
  if (!result.ok) return { ok: false, error: result.error };

  return {
    ok: true,
    factorId: result.factorId,
    qrCode: result.qrCode,
    secret: result.secret,
    uri: result.uri,
  };
}

/** Verify the 6-digit code to finish enrollment (upgrades the session to aal2). */
export async function confirmMfaEnrollmentAction(
  _prev: MfaSimpleState,
  formData: FormData,
): Promise<MfaSimpleState> {
  const { user } = await getPlatformSession();
  if (!user) return { error: "Your session expired. Sign in again." };

  const factorId = String(formData.get("factorId") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  if (!factorId || !/^\d{6}$/.test(code)) {
    return { error: "Enter the 6-digit code from your authenticator app." };
  }

  const supabase = await createSessionClient();
  const result = await verifyTotp(supabase, factorId, code);
  if (!result.ok) return { error: "That code is not valid. Try the next one." };

  return { ok: "Two-factor authentication is now on for this account." };
}

/**
 * Turn off two-factor for the signed-in user.
 *
 * Requires a **fresh aal2 session**: if the current session only has a password,
 * someone holding a stolen password could otherwise remove the second factor.
 */
export async function disableMfaAction(
  _prev: MfaSimpleState,
  formData: FormData,
): Promise<MfaSimpleState> {
  const { user } = await getPlatformSession();
  if (!user) return { error: "Your session expired. Sign in again." };

  const factorId = String(formData.get("factorId") ?? "").trim();
  if (!factorId) return { error: "No factor selected." };

  const supabase = await createSessionClient();
  const assurance = await getMfaAssurance(supabase);
  if (assurance.currentLevel !== "aal2") {
    return {
      error:
        "Confirm your second factor before turning it off. Sign out and back in, then try again.",
    };
  }

  const result = await unenrollTotp(supabase, factorId);
  if (!result.ok) return { error: result.error };
  return { ok: "Two-factor authentication turned off." };
}

/**
 * Clear a colleague's MFA (lost phone). Ops-only, and it does **not** need the
 * target's code — that is the whole point of a reset.
 *
 * Done through the platform (service-role) Auth Admin API. Every use is a
 * security-relevant event, so callers must audit it.
 */
export async function resetUserMfaAction(
  _prev: MfaSimpleState,
  formData: FormData,
): Promise<MfaSimpleState> {
  const { user } = await getPlatformSession();
  if (!user) return { error: "Your session expired. Sign in again." };

  const userId = String(formData.get("userId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!userId) return { error: "No account selected." };

  const platform = createPlatformClient();
  const { data, error } = await platform.auth.admin.mfa.listFactors({ userId });
  if (error) return { error: error.message };

  const factors = data?.factors ?? [];
  if (factors.length === 0) {
    return { ok: `${email || "That account"} has no two-factor set up.` };
  }

  for (const factor of factors) {
    const { error: deleteError } = await platform.auth.admin.mfa.deleteFactor({
      userId,
      id: factor.id,
    });
    if (deleteError) return { error: deleteError.message };
  }

  return {
    ok: `Two-factor reset for ${email || "that account"}. They can sign in and re-enroll.`,
  };
}

/** MFA status for the signed-in user (used by the drawer). */
export async function readOwnMfaStatusAction(): Promise<{
  enrolled: boolean;
  factorId: string | null;
}> {
  const { user } = await getPlatformSession();
  if (!user) return { enrolled: false, factorId: null };
  const supabase = await createSessionClient();
  const status = await listTotpFactors(supabase);
  const verified = status.factors.find((f) => f.status === "verified");
  return { enrolled: status.enrolled, factorId: verified?.id ?? null };
}
