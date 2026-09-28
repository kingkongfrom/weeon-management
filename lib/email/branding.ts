import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Inline attachment id for the **company** wordmark in transactional email HTML.
 *
 * Email is customer-facing, so it always carries the company brand
 * ("Weeon School"), never a console surface label such as "Ops".
 */
export const WEEON_EMAIL_LOGO_CID = "weeon-school-logo";

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
 *  PNG is a Playwright raster of `EmailBrandLogo` (`components/email-brand-logo.tsx`),
 *  which is intentionally separate from the console `Logo`.
 *  Read from disk each send so `npm run render:email-logo` updates apply without restart. */
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
