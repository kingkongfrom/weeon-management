import { describe, it, expect } from "vitest";
import type { RichTextDoc } from "@/lib/comms/model";
import {
  richDocToEmailHtml,
  richDocToEmailParts,
} from "@/lib/comms/render-email-html";

/**
 * Ops staff compose outbound email as a ProseMirror document; this module turns
 * it into the HTML that is actually sent. Mail clients render whatever HTML they
 * are given, so a payload that escapes here reaches the recipient's inbox
 * directly — there is no CSP and no framework sanitizer downstream.
 *
 * Only ops staff can author the document, which bounds the severity, but the
 * escaping is still the boundary. This suite exists because the module had no
 * test while carrying its own copy of escapeHtml that omitted the apostrophe
 * escape (folded into the canonical lib/email/letter.ts on 3 Nov 2026).
 */
const doc = (...content: unknown[]): RichTextDoc => ({ type: "doc", content }) as RichTextDoc;

const para = (...content: unknown[]) => ({ type: "paragraph", content });
const text = (value: string, marks?: unknown[]) => ({ type: "text", text: value, marks });

describe("richDocToEmailHtml", () => {
  it("wraps blocks in the rte-content container", () => {
    const html = richDocToEmailHtml(doc(para(text("Hola"))));
    expect(html).toContain('<div class="rte-content">');
    expect(html).toContain("Hola");
    expect(html.endsWith("</div>")).toBe(true);
  });

  it("escapes a payload typed into the body", () => {
    const html = richDocToEmailHtml(doc(para(text("<script>alert(1)</script>"))));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes ampersands before other characters", () => {
    const html = richDocToEmailHtml(doc(para(text("Tom & Jerry <3"))));
    expect(html).toContain("Tom &amp; Jerry &lt;3");
  });

  it("escapes an apostrophe", () => {
    // The local copy this replaced did not, which would break out of any
    // single-quoted attribute added later.
    const html = richDocToEmailHtml(doc(para(text("O'Brien"))));
    expect(html).toContain("O&#39;Brien");
  });

  it("renders an empty paragraph as a line break", () => {
    expect(richDocToEmailHtml(doc(para()))).toContain("<br />");
  });

  it("renders a link with a double-quoted href and escapes the attribute", () => {
    const html = richDocToEmailHtml(
      doc(para(text("click", [{ type: "link", attrs: { href: "https://x.test/?a=1&b=2" } }]))),
    );
    expect(html).toContain('<a href="https://x.test/?a=1&amp;b=2"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it("does not let a quote in an href break out of the attribute", () => {
    const html = richDocToEmailHtml(
      doc(para(text("x", [{ type: "link", attrs: { href: 'https://x.test/"><script>' } }]))),
    );
    expect(html).not.toContain('"><script>');
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });

  it("drops a link mark that has no usable href", () => {
    // Returns the text without an anchor rather than emitting href="undefined".
    for (const attrs of [undefined, {}, { href: "   " }, { href: 42 }]) {
      const html = richDocToEmailHtml(doc(para(text("plain", [{ type: "link", attrs }]))));
      expect(html, JSON.stringify(attrs)).not.toContain("<a ");
      expect(html).toContain("plain");
    }
  });

  it("renders the supported inline marks", () => {
    const html = richDocToEmailHtml(
      doc(
        para(
          text("b", [{ type: "bold" }]),
          text("i", [{ type: "italic" }]),
          text("u", [{ type: "underline" }]),
          text("s", [{ type: "strike" }]),
          text("c", [{ type: "code" }]),
          text("h", [{ type: "highlight" }]),
        ),
      ),
    );
    expect(html).toContain("<strong>b</strong>");
    expect(html).toContain("<em>i</em>");
    expect(html).toContain("<u>u</u>");
    expect(html).toContain("<s>s</s>");
    expect(html).toContain("<code>c</code>");
    expect(html).toContain("<mark>h</mark>");
  });

  it("ignores an unknown mark instead of dropping the text", () => {
    const html = richDocToEmailHtml(doc(para(text("kept", [{ type: "futureMark" }]))));
    expect(html).toContain("kept");
  });
});

describe("richDocToEmailParts", () => {
  it("returns both a plain-text and an HTML body", () => {
    const parts = richDocToEmailParts(doc(para(text("Hola <mundo>"))));
    expect(parts.html).toContain("&lt;mundo&gt;");
    expect(parts.text).toContain("Hola");
  });

  it("keeps the plain-text alternative free of the markup", () => {
    const parts = richDocToEmailParts(doc(para(text("b", [{ type: "bold" }]))));
    expect(parts.text).not.toContain("<strong>");
  });
});
