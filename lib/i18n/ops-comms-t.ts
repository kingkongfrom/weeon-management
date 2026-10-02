"use client";

import { useT } from "@/lib/i18n/client";

/** Flat `comms.*` keys used by copied tenant rich-text / compose UI. */
export function useOpsCommsT() {
  const m = useT();
  const o = m.opsEmail;
  const rte = o.rte;

  return function opsCommsT(key: string): string {
    switch (key) {
      case "comms.rte.undo":
        return rte.undo;
      case "comms.rte.redo":
        return rte.redo;
      case "comms.rte.paragraph":
        return rte.paragraph;
      case "comms.rte.heading1":
        return rte.heading1;
      case "comms.rte.heading2":
        return rte.heading2;
      case "comms.rte.heading3":
        return rte.heading3;
      case "comms.rte.bold":
        return rte.bold;
      case "comms.rte.italic":
        return rte.italic;
      case "comms.rte.underline":
        return rte.underline;
      case "comms.rte.strike":
        return rte.strike;
      case "comms.rte.highlight":
        return rte.highlight;
      case "comms.rte.link":
        return rte.link;
      case "comms.rte.unlink":
        return rte.unlink;
      case "comms.rte.linkPrompt":
        return rte.linkPrompt;
      case "comms.rte.bulletList":
        return rte.bulletList;
      case "comms.rte.orderedList":
        return rte.orderedList;
      case "comms.rte.blockquote":
        return rte.blockquote;
      case "comms.rte.inlineCode":
        return rte.inlineCode;
      case "comms.rte.codeBlock":
        return rte.codeBlock;
      case "comms.rte.horizontalRule":
        return rte.horizontalRule;
      case "comms.rte.alignLeft":
        return rte.alignLeft;
      case "comms.rte.alignCenter":
        return rte.alignCenter;
      case "comms.rte.alignRight":
        return rte.alignRight;
      case "comms.rte.alignJustify":
        return rte.alignJustify;
      case "comms.rte.clearFormatting":
        return rte.clearFormatting;
      default:
        return key;
    }
  };
}
