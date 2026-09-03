import "server-only";

import { Resend } from "resend";
import { loadWeeonEmailLogoAttachment } from "@/lib/email/branding";

export type EmailSendResult =
  | { success: true; id: string }
  | { success: false; error: string };

/** From-address for Weeon Ops mail. Never use Supabase's generic sender. */
export function brandedFromAddress(): string {
  const raw = process.env.RESEND_FROM?.trim() || "Weeon Ops <ops@weeon.school>";
  if (raw.includes("<")) return raw;
  return `Weeon Ops <${raw}>`;
}

export async function sendBrandedEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "RESEND_API_KEY is not configured. Could not send the email.",
    };
  }

  const resend = new Resend(apiKey);
  const logo = await loadWeeonEmailLogoAttachment();

  try {
    const { data, error } = await resend.emails.send({
      from: brandedFromAddress(),
      to: [input.to.trim().toLowerCase()],
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: [logo],
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data?.id) {
      return { success: false, error: "Resend did not return an email id." };
    }
    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
