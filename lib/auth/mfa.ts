import "server-only";

import type { Session, SupabaseClient } from "@supabase/supabase-js";

/**
 * TOTP (authenticator-app) multi-factor auth for Weeon Ops.
 *
 * Why TOTP and not email/SMS OTP:
 *  - Native to Supabase — no vendor, no per-message cost, no Twilio.
 *  - The shared secret lives on the user's device, so compromising the email
 *    inbox does not defeat it. Email is already one of our factors; delivering
 *    a second factor to the same inbox would add little.
 *  - Works offline.
 *
 * Supabase models this as **AAL** (Authenticator Assurance Level):
 *  - `aal1` — single factor (password only). What a normal sign-in yields.
 *  - `aal2` — two factors (password + a verified TOTP code).
 * `getAuthenticatorAssuranceLevel()` tells us the current level and the level
 * the session is *able* to reach, which is how the login flow decides whether a
 * challenge step is required.
 *
 * NOTE: MFA must be enabled in the Supabase project (Auth → Multi-Factor Auth →
 * TOTP) before enrollment works. See docs/security.md.
 */

export type MfaFactor = {
  id: string;
  friendlyName: string | null;
  status: "verified" | "unverified";
  createdAt: string;
};

export type MfaStatus = {
  /** A verified TOTP factor exists — the account is protected. */
  enrolled: boolean;
  factors: MfaFactor[];
};

/** Factors for the signed-in user, filtered to TOTP. */
export async function listTotpFactors(
  supabase: SupabaseClient,
): Promise<MfaStatus> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return { enrolled: false, factors: [] };

  const totp = data.totp ?? [];
  const factors: MfaFactor[] = totp.map((factor) => ({
    id: factor.id,
    friendlyName: factor.friendly_name ?? null,
    status: factor.status as "verified" | "unverified",
    createdAt: factor.created_at,
  }));

  return {
    enrolled: factors.some((factor) => factor.status === "verified"),
    factors,
  };
}

export type MfaAssurance = {
  currentLevel: string | null;
  nextLevel: string | null;
  /**
   * True when the session is at aal1 but could reach aal2 — i.e. the user has a
   * verified factor and must still pass the challenge.
   */
  needsChallenge: boolean;
};

/**
 * Authenticator Assurance Level for a session. `needsChallenge` is the signal
 * the login action and the dashboard gate use to decide whether to interrupt.
 */
export async function getMfaAssurance(
  supabase: SupabaseClient,
): Promise<MfaAssurance> {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) {
    return { currentLevel: null, nextLevel: null, needsChallenge: false };
  }
  return {
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel,
    needsChallenge:
      data.nextLevel === "aal2" && data.currentLevel !== data.nextLevel,
  };
}

export type EnrollResult =
  | {
      ok: true;
      factorId: string;
      /** SVG QR code — render inline. Data URL or otpauth URI also available. */
      qrCode: string;
      /** `otpauth://` URI for manual entry. */
      uri: string;
      secret: string;
    }
  | { ok: false; error: string };

/**
 * Begin TOTP enrollment. The factor is UNVERIFIED until `verifyTotp` succeeds —
 * an abandoned enrollment must not lock the user out, so it is safe to start.
 *
 * Any previous unverified factor is removed first: Supabase allows only one
 * verified TOTP factor, and stale unverified rows otherwise accumulate on retry.
 */
export async function enrollTotp(
  supabase: SupabaseClient,
  friendlyName: string,
  issuer = "Weeon Ops",
): Promise<EnrollResult> {
  const existing = await listTotpFactors(supabase);
  for (const factor of existing.factors) {
    if (factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
    issuer,
  });
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not start enrollment." };
  }

  return {
    ok: true,
    factorId: data.id,
    qrCode: data.totp.qr_code,
    uri: data.totp.uri,
    secret: data.totp.secret,
  };
}

export type VerifyResult = { ok: true } | { ok: false; error: string };

/**
 * Verify the 6-digit code for a factor. On success the session is upgraded to
 * aal2 and the factor becomes `verified`.
 */
export async function verifyTotp(
  supabase: SupabaseClient,
  factorId: string,
  code: string,
): Promise<VerifyResult> {
  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challenge) {
    return {
      ok: false,
      error: challengeError?.message ?? "Could not create a challenge.",
    };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: code.trim(),
  });
  if (verifyError) {
    return { ok: false, error: verifyError.message };
  }
  return { ok: true };
}

/**
 * Remove a TOTP factor (self-service "turn off two-factor").
 *
 * Guarded by requiring a fresh aal2 session at the call site: unenrolling from a
 * password-only session would let a stolen password remove the second factor.
 */
export async function unenrollTotp(
  supabase: SupabaseClient,
  factorId: string,
): Promise<VerifyResult> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Whether the given session has actually satisfied its second factor. */
export function isAal2(session: Session | null): boolean {
  if (!session) return false;
  const level = session.user?.factors
    ? session.user.factors.length > 0
      ? "aal2"
      : "aal1"
    : null;
  // Prefer the authoritative JWT claim when present.
  const claim = (session.access_token ? decodeAal(session.access_token) : null) ??
    level;
  return claim === "aal2";
}

/** Read the `aal` claim from a JWT without verifying it (display logic only). */
function decodeAal(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      ),
    );
    return typeof json?.aal === "string" ? json.aal : null;
  } catch {
    return null;
  }
}
