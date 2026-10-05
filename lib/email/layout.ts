import { renderWeeonLetter, WEEON_LETTER } from "@/lib/email/letter";

export { escapeHtml } from "@/lib/email/letter";

const copy =
  `margin:0;color:${WEEON_LETTER.inkSoft};font-size:15px;line-height:1.6;`;

type BrandedEmailInput = {
  lang?: "es" | "en";
  title: string;
  greeting?: string;
  /** Trusted HTML paragraphs. */
  intro: string;
  buttonLabel: string;
  buttonUrl: string;
  footer: string;
  showLogo?: boolean;
};

/** Shared company letter: navy header, Weeon School wordmark, gradient button. */
export function brandedEmailHtml(input: BrandedEmailInput): string {
  return renderWeeonLetter({
    lang: input.lang,
    title: input.title,
    greeting: input.greeting,
    bodyHtml: input.intro,
    button: { label: input.buttonLabel, url: input.buttonUrl },
    footer: input.footer,
    showLogo: input.showLogo,
  });
}

export function brandedEmailText(lines: string[]): string {
  return lines.join("\n");
}

/** Branded letter (wordmark + body) without a CTA button — ops compose mail. */
export function brandedLetterHtml(input: {
  lang?: "es" | "en";
  title: string;
  greeting?: string;
  introHtml: string;
  footer: string;
  showLogo?: boolean;
}): string {
  return renderWeeonLetter({
    lang: input.lang ?? "es",
    title: input.title,
    greeting: input.greeting,
    bodyHtml: input.introHtml,
    footer: input.footer.trim(),
    showLogo: input.showLogo,
  });
}

/** Plain message lines → HTML paragraphs for compose mail. */
export function plainTextToEmailParagraphs(body: string): string {
  const blocks = body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return `<p style="${copy}">&nbsp;</p>`;
  }

  return blocks
    .map((block, index) => {
      const lines = block.split("\n").map((line) => escapeImported(line.trim()));
      const inner = lines.join("<br />");
      const margin = index === blocks.length - 1 ? "0" : "0 0 14px";
      return `<p style="margin:${margin};color:${WEEON_LETTER.inkSoft};font-size:15px;line-height:1.6;">${inner}</p>`;
    })
    .join("");
}

function escapeImported(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
