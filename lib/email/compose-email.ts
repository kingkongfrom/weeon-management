import "server-only";

import {
  brandedEmailText,
  brandedLetterHtml,
  plainTextToEmailParagraphs,
} from "@/lib/email/layout";
import { sendBrandedEmail, type EmailSendResult } from "@/lib/email/send";

const SUPPORT_REPLY = "support@weeon.school";

function replyToForActor(actorEmail: string | null): string {
  const email = actorEmail?.trim().toLowerCase() ?? "";
  if (email.endsWith("@weeon.school")) return email;
  return process.env.OPS_EMAIL_REPLY_TO?.trim() || SUPPORT_REPLY;
}

/** Ops staff compose: branded Weeon School letter via Resend. */
export async function sendOpsComposeEmail(input: {
  to: string | string[];
  cc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  actorEmail: string | null;
  fromAddress: string;
  extraAttachments?: { filename: string; content: Buffer }[];
}): Promise<EmailSendResult> {
  const subject = input.subject.trim();
  const body = input.body.trim();
  const replyTo = replyToForActor(input.actorEmail);

  const introHtml = input.bodyHtml?.trim()
    ? `<div class="rte-content">${input.bodyHtml}</div>`
    : plainTextToEmailParagraphs(body);

  return sendBrandedEmail({
    to: input.to,
    cc: input.cc,
    subject,
    from: input.fromAddress,
    replyTo,
    extraAttachments: input.extraAttachments,
    text: brandedEmailText([subject, "", ...body.split(/\r?\n/)]),
    html: brandedLetterHtml({
      title: subject,
      introHtml,
      footer: "",
    }),
  });
}
