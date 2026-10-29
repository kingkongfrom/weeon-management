"use server";

import { isAuthDisabled } from "@/lib/auth/policy";
import { createSessionClient } from "@/lib/supabase/session";
import { passwordSchema } from "@/lib/auth/password";

export type ChangePasswordState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

/**
 * Changes the signed-in ops staff password from the account drawer.
 *
 * Same rules as the reset flow (`passwordSchema`), but no email round-trip:
 * Supabase verifies the current password by re-signing in, so a stolen browser
 * session alone cannot lock the real owner out. The session is restored right
 * after, because a fresh sign-in rotates the auth cookies.
 */
export async function changeOwnPassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  if (isAuthDisabled()) {
    return { ok: false, error: "Password changes are disabled in this environment." };
  }

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!current) {
    return { ok: false, error: "Enter your current password." };
  }

  const parsed = passwordSchema.safeParse(next);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Password does not meet the requirements.",
    };
  }
  if (next !== confirm) {
    return { ok: false, error: "The new passwords do not match." };
  }
  if (next === current) {
    return { ok: false, error: "Choose a password different from your current one." };
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const email = user?.email?.trim();
  if (userError || !email) {
    return { ok: false, error: "Your session expired. Sign in again." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: current,
  });
  if (verifyError) {
    return { ok: false, error: "Your current password is not correct." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: next });
  if (updateError) {
    console.error("[account] password update failed", updateError.message);
    return { ok: false, error: "We could not update your password. Please try again." };
  }

  // signInWithPassword + updateUser keep the user signed in, but re-establish
  // the session explicitly so the refreshed cookies survive the round-trip.
  await supabase.auth.signInWithPassword({ email, password: next });

  return { ok: true, message: "Password updated." };
}
