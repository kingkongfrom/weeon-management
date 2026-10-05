import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { WEEON_LETTER_WORDMARK_CID } from "@/lib/email/letter";

/**
 * Inline attachment id for the **company** wordmark in transactional email HTML.
 *
 * Email is customer-facing, so it always carries the company brand
 * ("Weeon School"), never a console surface label such as "Ops".
 */
export const WEEON_EMAIL_LOGO_CID = WEEON_LETTER_WORDMARK_CID;

/**
 * Public URL for the wordmark, for clients that block inline attachments.
 *
 * Served from the **company** marketing origin — not the ops console — because
 * this asset is company branding, not console branding.
 */
export function weeonEmailLogoUrl(): string {
  const origin =
    process.env.WEEON_MARKETING_ORIGIN ?? "https://www.weeon.school";
  return `${origin.replace(/\/$/, "")}/email/logo-wordmark.png`;
}

/** Loads the company wordmark as a Resend inline attachment.
 *  Transparent PNG: Weeon in #2b59ff, smile, School in white at medium weight,
 *  so it sits on the navy header. Same artwork as weeon-tenants/public/email/logo-wordmark.png.
 *  Read from disk each send so a replaced file applies without restart. */
export async function loadWeeonEmailLogoAttachment(): Promise<{
  filename: string;
  content: Buffer;
  contentId: string;
}> {
  const path = join(process.cwd(), "public", "email", "logo-wordmark.png");
  const content = await readFile(path);

  return {
    filename: "weeon-school-logo.png",
    content,
    contentId: WEEON_EMAIL_LOGO_CID,
  };
}
