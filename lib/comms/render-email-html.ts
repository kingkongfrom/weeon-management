import "server-only";

import type { RichTextDoc, RichTextMark, RichTextNode } from "@/lib/comms/model";
import { docToPlainText } from "@/lib/comms/model";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function alignAttr(attrs?: Record<string, unknown>): string {
  const align = attrs?.textAlign;
  if (typeof align !== "string" || align === "left" || align === "start") return "";
  if (!["center", "right", "justify", "end"].includes(align)) return "";
  return ` style="text-align: ${align}"`;
}

function applyMark(html: string, mark: RichTextMark): string {
  switch (mark.type) {
    case "bold":
      return `<strong>${html}</strong>`;
    case "italic":
      return `<em>${html}</em>`;
    case "underline":
      return `<u>${html}</u>`;
    case "strike":
      return `<s>${html}</s>`;
    case "code":
      return `<code>${html}</code>`;
    case "highlight":
      return `<mark>${html}</mark>`;
    case "link": {
      const href = mark.attrs?.href;
      if (typeof href !== "string" || !href.trim()) return html;
      const safeHref = escapeHtml(href.trim());
      return `<a href="${safeHref}" rel="noopener noreferrer" target="_blank">${html}</a>`;
    }
    default:
      return html;
  }
}

function renderTextNode(node: RichTextNode): string {
  const raw = node.text ?? "";
  let html = escapeHtml(raw);
  const marks = node.marks ?? [];
  for (const mark of marks) {
    html = applyMark(html, mark);
  }
  return html;
}

function renderInlineContent(nodes: RichTextNode[] | undefined): string {
  return (nodes ?? [])
    .map((node) => {
      if (node.type === "text") return renderTextNode(node);
      if (node.type === "hardBreak") return "<br />";
      return renderBlockNode(node);
    })
    .join("");
}

function renderBlockNode(node: RichTextNode): string {
  switch (node.type) {
    case "paragraph": {
      const inner = renderInlineContent(node.content);
      return `<p${alignAttr(node.attrs)}>${inner || "<br />"}</p>`;
    }
    case "heading": {
      const levelRaw = node.attrs?.level;
      const level = levelRaw === 2 || levelRaw === 3 ? levelRaw : 1;
      const tag = `h${level}`;
      const inner = renderInlineContent(node.content);
      return `<${tag}${alignAttr(node.attrs)}>${inner}</${tag}>`;
    }
    case "bulletList":
      return `<ul>${(node.content ?? []).map(renderBlockNode).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(node.content ?? []).map(renderBlockNode).join("")}</ol>`;
    case "listItem":
      return `<li>${(node.content ?? []).map(renderBlockNode).join("")}</li>`;
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map(renderBlockNode).join("")}</blockquote>`;
    case "codeBlock": {
      const text = (node.content ?? [])
        .map((child) => (child.type === "text" ? child.text ?? "" : ""))
        .join("");
      return `<pre><code>${escapeHtml(text)}</code></pre>`;
    }
    case "horizontalRule":
      return "<hr />";
    default:
      return renderInlineContent(node.content);
  }
}

/** ProseMirror JSON → HTML for outbound email (no TipTap on the server — RSC-safe). */
export function richDocToEmailHtml(doc: RichTextDoc): string {
  const blocks = (doc.content ?? []).map(renderBlockNode).join("");
  return `<div class="rte-content">${blocks}</div>`;
}

export function richDocToEmailParts(doc: RichTextDoc): { text: string; html: string } {
  return {
    text: docToPlainText(doc),
    html: richDocToEmailHtml(doc),
  };
}
