import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Inline attachment id for the Weeon wordmark in transactional email HTML. */
export const WEEON_EMAIL_LOGO_CID = "weeon-wordmark";

/** Public URL for the wordmark (fallback when clients block inline attachments). */
export function weeonEmailLogoUrl(): string {
  const origin = process.env.WEEON_OPS_ORIGIN ?? "https://ops.weeon.school";
  return `${origin.replace(/\/$/, "")}/email/logo-wordmark.png`;
}

let cachedLogo: Buffer | null = null;

/** Loads the full "Weeon Ops" wordmark as a Resend inline attachment. */
export async function loadWeeonEmailLogoAttachment(): Promise<{
  filename: string;
  content: Buffer;
  contentId: string;
}> {
  if (!cachedLogo) {
    const path = join(process.cwd(), "public", "email", "logo-wordmark.png");
    cachedLogo = await readFile(path);
  }

  return {
    filename: "weeon-wordmark.png",
    content: cachedLogo,
    contentId: WEEON_EMAIL_LOGO_CID,
  };
}
