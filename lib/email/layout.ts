import { WEEON_EMAIL_LOGO_CID } from "@/lib/email/branding";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type BrandedEmailInput = {
  title: string;
  intro: string;
  buttonLabel: string;
  buttonUrl: string;
  footer: string;
};

/** Shared Weeon Ops HTML chrome (logo, card, gradient button). */
export function brandedEmailHtml(input: BrandedEmailInput): string {
  const title = escapeHtml(input.title);
  const buttonLabel = escapeHtml(input.buttonLabel);
  const buttonUrl = escapeHtml(input.buttonUrl);
  const footer = escapeHtml(input.footer);
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f6f7f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f7f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;text-align:left;">
            <tr>
              <td align="center" style="padding:28px 28px 12px;">
                <img src="cid:${WEEON_EMAIL_LOGO_CID}" alt="Weeon" width="48" height="48" style="display:block;width:48px;height:48px;border:0;border-radius:12px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 12px;">
                <p style="margin:0;color:#24292f;font-size:18px;font-weight:600;">${title}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 28px 16px;">
                ${input.intro}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 28px 24px;">
                <a href="${buttonUrl}" style="display:inline-block;background:linear-gradient(135deg,#5b3df5,#a855f7);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:999px;">${buttonLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 28px 28px;">
                <p style="margin:0;color:#8b949e;font-size:13px;line-height:1.5;">${footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function brandedEmailText(lines: string[]): string {
  return lines.join("\n");
}
