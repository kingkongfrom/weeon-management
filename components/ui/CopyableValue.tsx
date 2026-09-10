"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Inline value with a copy-to-clipboard affordance. Used for identifiers ops
 * shares out (Código SABER, tenant id). Renders server data safely.
 */
export function CopyableValue({
  value,
  label,
  mono = false,
}: {
  value: string;
  label?: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context) — leave the value readable.
    }
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span
        className={`truncate ${mono ? "font-mono text-xs" : ""}`}
        title={value}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={label ? `Copy ${label}` : "Copy value"}
        className="grid h-5 w-5 shrink-0 place-items-center rounded text-foreground/40 transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        {copied ? (
          <Check size={13} className="text-success" />
        ) : (
          <Copy size={13} />
        )}
      </button>
    </span>
  );
}
