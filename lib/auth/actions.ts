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
import { requestPasswordReset } from "@/lib/auth/password-reset-actions";

export type AuthResult = { ok: true; redirectTo?: string } | { ok: false; error: string };

export type LoginState = { error?: string } | null;

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
 */
export async function signInStaff(
  emailRaw: string,
  password: string,
): Promise<AuthResult> {
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

  const target = next === "/" ? "/dashboard" : next;
  redirect(target);
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
