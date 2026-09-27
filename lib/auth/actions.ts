"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/session";
import { isAllowedStaffEmailDomain } from "@/lib/auth/policy";
import { canAccessOpsConsole } from "@/lib/auth/platform-staff";
import { isAllowedStaffEmailDomainError } from "@/lib/auth/messages";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { normalizeEmail } from "@/lib/auth/policy";
import {
  clientIpFrom,
  consumeRateLimit,
  resetRateLimit,
} from "@/lib/auth/rate-limit";
import { getMfaAssurance, listTotpFactors, verifyTotp } from "@/lib/auth/mfa";
import { requestPasswordReset } from "@/lib/auth/password-reset-actions";

export type AuthResult = { ok: true; redirectTo?: string } | { ok: false; error: string };

export type LoginState = { error?: string; mfaRequired?: boolean } | null;

/** Attempts allowed per window, per email and per IP. */
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Sign in a platform-staff user by email + password.
 *
 * Security model:
 *  - The form accepts ONLY staff email addresses (see policy.ts).
 *  - Every request does domain + individual allow-list checks on the email;
 *    callers are responsible for running this server action on submit.
 *  - Throttled per email AND per client IP. This is **not** an account lockout:
 *    nothing is disabled, counters expire on their own, and a successful sign-in
 *    clears the email bucket, so a real admin cannot be locked out.
 *
 * When the account has a verified TOTP factor, the password step yields an
 * **aal1** session only. This function reports `mfaRequired` so the UI collects
 * the 6-digit code; the session is not usable for the dashboard until the
 * challenge is passed (`proxy.ts` and the dashboard gate enforce aal2).
 */
export async function signInStaff(
  emailRaw: string,
  password: string,
): Promise<AuthResult & { mfaRequired?: boolean }> {
  if (!isAllowedStaffEmailDomain(emailRaw)) {
    return { ok: false, error: isAllowedStaffEmailDomainError() };
  }
  if (!(await canAccessOpsConsole(emailRaw))) {
    return { ok: false, error: "That account is not on the ops allow list." };
  }

  const email = normalizeEmail(emailRaw);
  const ip = clientIpFrom(await headers());
  const emailKey = `login:email:${email}`;
  const ipKey = `login:ip:${ip}`;

  const emailLimit = consumeRateLimit(emailKey, {
    limit: LOGIN_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });
  const ipLimit = consumeRateLimit(ipKey, {
    limit: LOGIN_LIMIT * 3,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!emailLimit.allowed || !ipLimit.allowed) {
    const retry = Math.max(
      emailLimit.retryAfterSeconds,
      ipLimit.retryAfterSeconds,
    );
    return {
      ok: false,
      error: `Too many sign-in attempts. Try again in ${retry} second${retry === 1 ? "" : "s"}.`,
    };
  }

  try {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: emailRaw.trim(),
      password,
    });

    if (error) {
      return { ok: false, error: friendlyAuthError() };
    }

    // Password accepted — but a verified TOTP factor means this is only aal1.
    // Report the requirement instead of redirecting into the dashboard.
    const assurance = await getMfaAssurance(supabase);
    if (assurance.needsChallenge) {
      return { ok: true, mfaRequired: true };
    }

    // Success clears the counter for this email (IP bucket keeps its own count).
    resetRateLimit(emailKey);
    return { ok: true, redirectTo: "/dashboard" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Sign-in failed. Try again.",
    };
  }
}

export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/dashboard"));

  const result = await signInStaff(email, password);
  if (!result.ok) {
    return { error: result.error };
  }

  // Password ok but a second factor is required: hand off to the code step.
  if (result.mfaRequired) {
    return { mfaRequired: true };
  }

  const target = next === "/" ? "/dashboard" : next;
  redirect(target);
}

/**
 * Complete the second factor. The session is already aal1 from the password
 * step; verifying a TOTP code upgrades it to aal2, which is what the dashboard
 * gate requires.
 */
export async function verifyMfaLoginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const code = String(formData.get("code") ?? "").trim();
  const next = safeNextPath(String(formData.get("next") ?? "/dashboard"));

  if (!/^\d{6}$/.test(code)) {
    return { mfaRequired: true, error: "Enter the 6-digit code from your authenticator app." };
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session expired. Sign in again." };
  }

  const status = await listTotpFactors(supabase);
  const factor = status.factors.find((f) => f.status === "verified");
  if (!factor) {
    return { error: "No two-factor method is set up. Contact another ops admin." };
  }

  // Throttle code attempts too — a 6-digit space is small enough to matter.
  const limit = consumeRateLimit(`mfa:${user.id}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return {
      mfaRequired: true,
      error: `Too many attempts. Try again in ${limit.retryAfterSeconds} seconds.`,
    };
  }

  const result = await verifyTotp(supabase, factor.id, code);
  if (!result.ok) {
    return { mfaRequired: true, error: "That code is not valid. Try the next one." };
  }

  const target = next === "/" ? "/dashboard" : next;
  redirect(target);
}

/** Abandon a half-finished MFA login (signs the aal1 session out). */
export async function cancelMfaLoginAction(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export type ResetState = { message?: string; error?: string } | null;

/**
 * Request a branded reset email for an ops staff account. Always returns a
 * generic success message to avoid account enumeration; real send failures are
 * surfaced so the user knows to try again.
 */
export async function forgotPasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const result = await requestPasswordReset({}, formData);
  if (result?.error) {
    return { error: result.error };
  }
  return {
    message: "If that account exists, a reset link is on its way.",
  };
}

/** User-facing reason for a failed credential sign-in. Does not leak accounts. */
function friendlyAuthError(): string {
  return "Incorrect email or password for the ops console.";
}
