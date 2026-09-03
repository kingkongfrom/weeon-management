"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/session";
import { isAllowedStaffEmailDomain } from "@/lib/auth/policy";
import { canAccessOpsConsole } from "@/lib/auth/platform-staff";
import { isAllowedStaffEmailDomainError } from "@/lib/auth/messages";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { requestPasswordReset } from "@/lib/auth/password-reset-actions";

export type AuthResult = { ok: true; redirectTo?: string } | { ok: false; error: string };

export type LoginState = { error?: string } | null;

/**
 * Sign in a platform-staff user by email + password.
 *
 * Security model:
 *  - The form accepts ONLY staff email addresses (see policy.ts).
 *  - Every request does domain + individual allow-list checks on the email;
 *    callers are responsible for running this server action on submit.
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

  try {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: emailRaw.trim(),
      password,
    });

    if (error) {
      return { ok: false, error: friendlyAuthError() };
    }

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
