import "server-only";

import {
  isAllowedStaffEmail,
  normalizeEmail,
  OPS_CONSOLE_APP_NAME,
} from "@/lib/auth/policy";
import { sendPasswordResetEmail } from "@/lib/auth/reset-email";
import { resolveOrCreateAuthUser, setOpsStaffPassword } from "@/lib/auth/auth-user";
import {
  consumeOpsToken,
  getInvitedOpsMember,
  mintOpsToken,
  PASSWORD_RESET_TTL_MS,
  peekOpsToken,
} from "@/lib/auth/ops-staff-store";

export { PASSWORD_RESET_TTL_MS, OPS_CONSOLE_APP_NAME };

export type ResetMint =
  | { success: true; email: string }
  | { success: false; error: string };

/**
 * True when this email is Weeon Ops staff (directory or accepted invite).
 * Never uses tenant `profiles` or school-admin tables.
 */
export async function isOpsStaffAccount(emailInput: string): Promise<boolean> {
  const email = normalizeEmail(emailInput);
  if (isAllowedStaffEmail(email)) return true;
  const invited = await getInvitedOpsMember(email);
  return Boolean(invited && !invited.pending);
}

/**
 * Mints a single-use reset token for an ops staff account and sends the branded
 * email. Only runs for a real ops staff account; otherwise returns success
 * anyway (generic, enumeration-safe).
 */
export async function mintPasswordReset(
  emailInput: string,
  requestOrigin: string,
): Promise<ResetMint> {
  const email = normalizeEmail(emailInput);
  if (!(await isOpsStaffAccount(email))) {
    return { success: true, email };
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return { success: false, error: "reset.sendFailed" };
  }

  const user = await resolveOrCreateAuthUser(email);
  const minted = await mintOpsToken(email, "reset", PASSWORD_RESET_TTL_MS, user?.id ?? null);
  const resetUrl = `${requestOrigin.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(minted.token)}`;
  const sent = await sendPasswordResetEmail({
    to: email,
    resetUrl,
    appName: OPS_CONSOLE_APP_NAME,
  });
  if (!sent.success) {
    console.error("[password-reset] send reset email failed", sent.error);
    return { success: false, error: "reset.sendFailed" };
  }

  return { success: true, email };
}

export async function consumeResettableToken(
  token: string,
): Promise<{ email: string; userId: string | null } | null> {
  return peekOpsToken(token, "reset");
}

export async function applyPasswordReset(
  token: string,
  password: string,
): Promise<{ ok: true; userId: string; email: string } | { ok: false; code: string }> {
  const row = await peekOpsToken(token, "reset");
  if (!row) {
    return { ok: false, code: "reset.invalidLink" };
  }

  const invited = await getInvitedOpsMember(row.email);
  let userId = row.userId ?? invited?.userId ?? null;
  if (!userId) {
    const user = await resolveOrCreateAuthUser(row.email);
    userId = user?.id ?? null;
  }
  if (!userId) {
    return { ok: false, code: "reset.updateFailed" };
  }

  const updated = await setOpsStaffPassword(userId, password);
  if (!updated) {
    console.error("[password-reset] update password failed");
    return { ok: false, code: "reset.updateFailed" };
  }

  const consumed = await consumeOpsToken(token, "reset");
  if (!consumed) {
    return { ok: false, code: "reset.invalidLink" };
  }

  return { ok: true, userId, email: row.email };
}
