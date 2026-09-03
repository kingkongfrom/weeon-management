import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Inline attachment id for the Weeon mark in transactional email HTML. */
export const WEEON_EMAIL_LOGO_CID = "weeon-mark";

/** Public URL for the mark (fallback when clients block inline attachments). */
export function weeonEmailLogoUrl(): string {
  const origin = process.env.WEEON_OPS_ORIGIN ?? "https://ops.weeon.school";
  return `${origin.replace(/\/$/, "")}/email/logo-mark.png`;
}

let cachedLogo: Buffer | null = null;

/** Loads the Weeon email mark as a Resend inline attachment. */
export async function loadWeeonEmailLogoAttachment(): Promise<{
  filename: string;
  content: Buffer;
  contentId: string;
}> {
  if (!cachedLogo) {
    const path = join(process.cwd(), "public", "email", "logo-mark.png");
    cachedLogo = await readFile(path);
  }

  return {
    filename: "weeon-mark.png",
    content: cachedLogo,
    contentId: WEEON_EMAIL_LOGO_CID,
  };
}
