import "server-only";

import { OPS_CONSOLE_APP_NAME, PLATFORM_STAFF_INVITER_EMAIL } from "@/lib/auth/policy";
import { brandedEmailHtml, brandedEmailText, escapeHtml } from "@/lib/email/layout";
import { sendBrandedEmail, type EmailSendResult } from "@/lib/email/send";

export function renderOpsInviteEmail(input: {
  inviteUrl: string;
  inviterEmail?: string;
}): { subject: string; text: string; html: string } {
  const inviter = input.inviterEmail?.trim() || PLATFORM_STAFF_INVITER_EMAIL;
  const safeApp = escapeHtml(OPS_CONSOLE_APP_NAME);
  const safeInviter = escapeHtml(inviter);
  const footer =
    "The link is valid for 7 days. If you were not expecting this, you can ignore this email.";
  return {
    subject: `You're invited to ${OPS_CONSOLE_APP_NAME}`,
    text: brandedEmailText([
      "Hello.",
      "",
      `${inviter} invited you to ${OPS_CONSOLE_APP_NAME}, the Weeon platform operations console.`,
      "",
      "This is not a school (tenant) administrator invite. Accepting it only grants access to ops.weeon.school.",
      "",
      "Set your password with this link:",
      "",
      input.inviteUrl,
      "",
      footer,
    ]),
    html: brandedEmailHtml({
      lang: "en",
      title: "You're invited",
      greeting: "Hello.",
      intro: `<p style="margin:0;color:#3a4360;font-size:15px;line-height:1.6;">
        <strong>${safeInviter}</strong> invited you to
        <strong>${safeApp}</strong>, the Weeon platform operations console.
      </p>
      <p style="margin:14px 0 0;color:#3a4360;font-size:15px;line-height:1.6;">
        This is not a school administrator invite. Accepting it only grants access to the ops console.
      </p>
      <p style="margin:14px 0 0;color:#3a4360;font-size:15px;line-height:1.6;">
        Set your password with the button below to get started.
      </p>`,
      buttonLabel: "Accept invitation",
      buttonUrl: input.inviteUrl,
      footer,
    }),
  };
}

export async function sendOpsInviteEmail(input: {
  to: string;
  inviteUrl: string;
  inviterEmail?: string;
}): Promise<EmailSendResult> {
  const rendered = renderOpsInviteEmail(input);
  return sendBrandedEmail({
    to: input.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}
