"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isAuthDisabled } from "@/lib/auth/policy";
import { createSessionClient } from "@/lib/supabase/session";
import { passwordSchema } from "@/lib/auth/password";
import { opsAppOrigin } from "@/lib/auth/ops-origin";
import {
  applyPasswordReset,
  consumeResettableToken,
  mintPasswordReset,
} from "@/lib/auth/password-reset";

export type PasswordResetFormState = { ok?: boolean; error?: string } | null;

/**
 * Sends the branded reset email for an ops staff account. Enumeration-safe:
 * it always answers as if sent; only real allow-listed staff trigger an email.
 */
export async function requestPasswordReset(
  _prev: PasswordResetFormState,
  formData: FormData,
): Promise<PasswordResetFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (isAuthDisabled()) return { ok: true };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const origin = await currentOrigin();

  const result = await mintPasswordReset(email, origin);
  if (!result.success) {
    return {
      error:
        result.error === "reset.mintFailed"
          ? "Could not prepare a reset link. Please try again."
          : "The reset email could not be sent. Please try again later.",
    };
  }
  return { ok: true };
}

/** Validates a reset token for the /reset-password page. */
export async function validateResetToken(
  token: string,
): Promise<{ ok: true; email?: string } | { ok: false; error?: string }> {
  if (isAuthDisabled()) return { ok: false, error: "This reset link is no longer valid." };
  const row = await consumeResettableToken(token);
  if (!row) return { ok: false, error: "This reset link is no longer valid." };
  return { ok: true, email: row.email };
}

/**
 * Completes the reset from the hidden `token` + new password, then signs the
 * staff user in and goes to the dashboard.
 */
export async function completePasswordReset(
  _prev: PasswordResetFormState,
  formData: FormData,
): Promise<PasswordResetFormState> {
  const password = String(formData.get("password") ?? "");
  const token = String(formData.get("token") ?? "");

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Password does not meet the requirements." };
  }
  if (!token || isAuthDisabled()) {
    return { error: "This reset link is no longer valid." };
  }

  const applied = await applyPasswordReset(token, password);
  if (!applied.ok) {
    return {
      error:
        applied.code === "reset.updateFailed"
          ? "We could not update your password. The link may have expired; please request a new one."
          : "This reset link is no longer valid.",
    };
  }

  // Sign in with the fresh password and land directly on the dashboard.
  const supabase = await createSessionClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: applied.email,
    password,
  });
  if (signInError) {
    redirect(`/?reset=done`);
  }
  redirect("/dashboard");
}

async function currentOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origin = host ? `${proto}://${host}` : null;
  return opsAppOrigin(origin);
}
