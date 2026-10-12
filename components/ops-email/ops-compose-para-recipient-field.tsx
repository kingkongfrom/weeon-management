"use client";

import { useRef, useState, type RefObject } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function OpsComposeParaRecipientField({
  emails,
  onChange,
  disabled = false,
  inputRef: externalInputRef,
}: {
  emails: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const t = useT();
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalRef;
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  function removeEmail(email: string) {
    onChange(emails.filter((row) => row !== email));
  }

  function commitQuery() {
    const email = normalizeEmail(query);
    if (!email) return;
    if (!EMAIL_RE.test(email)) {
      setError(t.opsEmail.invalidEmail);
      return;
    }
    if (!emails.includes(email)) {
      onChange([...emails, email]);
    }
    setQuery("");
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="relative min-w-0 flex-1">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {emails.map((email) => (
          <span
            key={email}
            className="inline-flex max-w-full items-center gap-1 rounded-md bg-surface px-2 py-0.5 ring-1 ring-border/60"
          >
            <span className="truncate text-xs font-medium text-foreground/85">{email}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeEmail(email)}
              className="flex h-5 w-5 items-center justify-center rounded-full text-foreground/40 hover:bg-error/10 hover:text-error disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          inputMode="email"
          autoComplete="off"
          value={query}
          disabled={disabled}
          placeholder={emails.length === 0 ? t.opsEmail.recipientInputPlaceholder : undefined}
          className="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm text-foreground outline-none disabled:opacity-50"
          onChange={(event) => {
            setError(null);
            setQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
              if (query.trim()) {
                event.preventDefault();
                commitQuery();
              }
            }
            if (event.key === "Escape") {
              setQuery("");
              setError(null);
            }
          }}
          onBlur={() => {
            if (query.trim()) commitQuery();
          }}
        />
      </div>
      {error ? <p className={cn("mt-1 text-xs font-medium text-error")}>{error}</p> : null}
    </div>
  );
}
