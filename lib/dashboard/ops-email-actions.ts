"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPlatformSession } from "@/lib/auth/session";
import { sendOpsComposeEmail } from "@/lib/email/compose-email";
import { brandedFromAddress } from "@/lib/email/send";
import { insertOutboundEmailLog } from "@/lib/platform/outbound-email";
import { loadOpsMailboxSettings } from "@/lib/platform/ops-mailbox-settings";

export type OpsEmailActionState = { ok?: string; error?: string } | null;

const composeSchema = z.object({
  to: z.string().trim().email("Enter a valid recipient email."),
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  body: z.string().trim().min(1, "Message is required.").max(20_000),
});

async function requireOpsActor(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; error: string }
> {
  const { user, sessionUser } = await getPlatformSession();
  if (!user) return { ok: false, error: "Your session expired. Sign in again." };
  const email = sessionUser?.email?.trim() ?? "";
  if (!email) return { ok: false, error: "Your account has no email on file." };
  return { ok: true, userId: user.id, email };
}

export async function sendOpsEmailAction(
  _prev: OpsEmailActionState,
  formData: FormData,
): Promise<OpsEmailActionState> {
  const actor = await requireOpsActor();
  if (!actor.ok) return { error: actor.error };

  const parsed = composeSchema.safeParse({
    to: formData.get("to"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { error: first };
  }

  const { to, subject, body } = parsed.data;
  const mailbox = await loadOpsMailboxSettings(actor.userId);
  const bodyWithSignature =
    mailbox.signatureText.trim().length > 0
      ? `${body.trim()}\n\n--\n${mailbox.signatureText.trim()}`
      : body;

  const sendResult = await sendOpsComposeEmail({
    to,
    subject,
    body: bodyWithSignature,
    actorEmail: actor.email,
    fromAddress: brandedFromAddress(),
  });

  const log = await insertOutboundEmailLog({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    toEmail: to,
    subject,
    bodyText: bodyWithSignature,
    status: sendResult.success ? "sent" : "failed",
    resendId: sendResult.success ? sendResult.id : null,
    errorMessage: sendResult.success ? null : sendResult.error,
  });

  revalidatePath("/dashboard/email");

  if (!sendResult.success) {
    const logNote = log.ok ? "" : ` (Log not saved: ${log.error})`;
    return { error: `${sendResult.error}${logNote}` };
  }

  if (!log.ok) {
    return {
      ok: `Email sent (Resend id ${sendResult.id}), but the send log could not be saved: ${log.error}`,
    };
  }

  return { ok: `Email sent to ${to}.` };
}
