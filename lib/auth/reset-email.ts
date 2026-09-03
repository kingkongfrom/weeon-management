import "server-only";

import { brandedEmailHtml, brandedEmailText, escapeHtml } from "@/lib/email/layout";
import { sendBrandedEmail, type EmailSendResult } from "@/lib/email/send";

export type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
  appName: string;
};

export type { EmailSendResult };

/**
 * Branded password-reset email for Weeon Ops, delivered by Resend.
 * Never use Supabase Auth's generic recovery email for this console.
 */
export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput,
): Promise<EmailSendResult> {
  const safeApp = escapeHtml(input.appName.trim());
  return sendBrandedEmail({
    to: input.to,
    subject: `Reset your password · ${input.appName}`,
    text: brandedEmailText([
      "Hello:",
      "",
      `We received a request to reset your password for ${input.appName}.`,
      "",
      "Choose a new password with this link:",
      "",
      input.resetUrl,
      "",
      "The link is valid for 24 hours. If you did not request it, you can ignore this email.",
    ]),
    html: brandedEmailHtml({
      title: "Reset your password",
      intro: `<p style="margin:0;color:#57606a;font-size:15px;line-height:1.5;">
        We received a request to reset your password for
        <strong>${safeApp}</strong>.
      </p>
      <p style="margin:14px 0 0;color:#57606a;font-size:15px;line-height:1.5;">
        Choose a new password with the button below:
      </p>`,
      buttonLabel: "Reset password",
      buttonUrl: input.resetUrl,
      footer:
        "The link is valid for 24 hours. If you did not request it, you can ignore this email.",
    }),
  });
}
