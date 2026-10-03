"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { richDocToEmailParts } from "@/lib/comms/render-email-html";
import type { RichTextDoc } from "@/lib/comms/model";
import { docHasContent } from "@/lib/comms/model";
import { getPlatformSession } from "@/lib/auth/session";
import { sendOpsComposeEmail } from "@/lib/email/compose-email";
import { resolveOpsFromAddress } from "@/lib/email/ops-from-addresses";
import { insertOutboundEmailLog } from "@/lib/platform/outbound-email";
import { loadOpsMailboxSettings } from "@/lib/platform/ops-mailbox-settings";

const emailSchema = z.string().trim().email();

export type OpsRichEmailResult = { ok: true; message: string } | { ok: false; error: string };

export async function sendOpsRichEmailAction(input: {
  to: string[];
  cc: string[];
  subject: string;
  body: RichTextDoc;
  fromKey?: string;
  attachments: { filename: string; contentBase64: string }[];
}): Promise<OpsRichEmailResult> {
  const { user, sessionUser } = await getPlatformSession();
  if (!user) return { ok: false, error: "Your session expired. Sign in again." };
  const actorEmail = sessionUser?.email?.trim() ?? "";
  if (!actorEmail) return { ok: false, error: "Your account has no email on file." };

  const to = input.to.map((e) => e.trim()).filter(Boolean);
  const cc = input.cc.map((e) => e.trim()).filter(Boolean);
  if (to.length === 0) return { ok: false, error: "Add at least one recipient." };

  for (const address of [...to, ...cc]) {
    if (!emailSchema.safeParse(address).success) {
      return { ok: false, error: `Invalid email: ${address}` };
    }
  }

  const subject = input.subject.trim();
  if (!subject) return { ok: false, error: "Subject is required." };
  if (!docHasContent(input.body)) return { ok: false, error: "Message is required." };

  const fromResolved = resolveOpsFromAddress(actorEmail, input.fromKey);
  if (!fromResolved.ok) return { ok: false, error: fromResolved.error };

  const mailbox = await loadOpsMailboxSettings(user.id);
  let bodyDoc = input.body;
  if (mailbox.signatureText.trim()) {
    bodyDoc = {
      type: "doc",
      content: [
        ...(bodyDoc.content ?? []),
        { type: "paragraph" },
        {
          type: "paragraph",
          content: [{ type: "text", text: mailbox.signatureText.trim() }],
        },
      ],
    };
  }

  const bodyPayload = JSON.parse(JSON.stringify(bodyDoc)) as RichTextDoc;
  const { text, html } = richDocToEmailParts(bodyPayload);
  const extraAttachments = input.attachments.map((file) => ({
    filename: file.filename,
    content: Buffer.from(file.contentBase64, "base64"),
  }));

  const sendResult = await sendOpsComposeEmail({
    to,
    cc,
    subject,
    body: text,
    bodyHtml: html,
    actorEmail,
    fromAddress: fromResolved.option.resendFrom,
    extraAttachments,
  });

  const primaryTo = to[0] ?? "";
  const log = await insertOutboundEmailLog({
    actorUserId: user.id,
    actorEmail,
    toEmail: to.length === 1 ? primaryTo : `${primaryTo} +${to.length - 1}`,
    subject,
    bodyText: text,
    status: sendResult.success ? "sent" : "failed",
    resendId: sendResult.success ? sendResult.id : null,
    errorMessage: sendResult.success ? null : sendResult.error,
  });

  revalidatePath("/dashboard/email");

  if (!sendResult.success) {
    return { ok: false, error: sendResult.error };
  }

  if (!log.ok) {
    return {
      ok: true,
      message: `Email sent, but the log could not be saved: ${log.error}`,
    };
  }

  return { ok: true, message: "Email sent." };
}
