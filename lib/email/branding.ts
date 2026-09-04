import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Inline attachment id for the Weeon wordmark in transactional email HTML. */
export const WEEON_EMAIL_LOGO_CID = "weeon-ops-logo";

/** Public URL for the wordmark (fallback when clients block inline attachments). */
export function weeonEmailLogoUrl(): string {
  const origin = process.env.WEEON_OPS_ORIGIN ?? "https://ops.weeon.school";
  return `${origin.replace(/\/$/, "")}/email/logo-wordmark.png`;
}

/** Loads the Weeon Ops wordmark as a Resend inline attachment.
 *  PNG is a Playwright raster of `Logo` from `components/logo.tsx`.
 *  Read from disk each send so `npm run render:email-logo` updates apply without restart. */
export async function loadWeeonEmailLogoAttachment(): Promise<{
  filename: string;
  content: Buffer;
  contentId: string;
}> {
  const path = join(process.cwd(), "public", "email", "logo-wordmark.png");
  const content = await readFile(path);

  return {
    filename: "weeon-ops-logo.png",
    content,
    contentId: WEEON_EMAIL_LOGO_CID,
  };
}
