"use client";

import { type RefObject } from "react";
import { UserPlus } from "lucide-react";
import { OpsComposeParaRecipientField } from "@/components/ops-email/ops-compose-para-recipient-field";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

export type OpsFromOption = {
  key: string;
  label: string;
};

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/25";

/** Para / Cc / Asunto (+ De) — matches tenant `ComposeEmailFields`. */
export function OpsComposeEmailFields({
  fromOptions,
  fromKey,
  onFromKeyChange,
  toEmails,
  ccEmails,
  onToChange,
  onCcChange,
  subject,
  onSubjectChange,
  onFocusToInput,
  onShowCcRow,
  showCcRow = false,
  toInputRef,
  ccInputRef,
  sending = false,
  showSubjectRow = true,
}: {
  fromOptions: OpsFromOption[];
  fromKey: string;
  onFromKeyChange: (key: string) => void;
  toEmails: string[];
  ccEmails: string[];
  onToChange: (emails: string[]) => void;
  onCcChange: (emails: string[]) => void;
  subject: string;
  onSubjectChange: (value: string) => void;
  onFocusToInput: () => void;
  onShowCcRow: () => void;
  showCcRow?: boolean;
  toInputRef?: RefObject<HTMLInputElement | null>;
  ccInputRef?: RefObject<HTMLInputElement | null>;
  sending?: boolean;
  showSubjectRow?: boolean;
}) {
  const t = useT();
  const fieldLabel = "w-[3.25rem] shrink-0 pt-0.5 text-xs font-semibold text-foreground/45 sm:w-14";
  const rowClass = "flex min-h-[2.25rem] items-start gap-2 border-b border-border/45 py-1.5 last:border-b-0";
  const selectedFromLabel =
    fromOptions.find((row) => row.key === fromKey)?.label ?? fromOptions[0]?.label ?? "";

  return (
    <div className="mb-1 rounded-lg border border-border/50 bg-surface-muted/20 px-3 py-0.5 sm:px-4">
      {fromOptions.length > 0 ? (
        fromOptions.length === 1 ? (
          <div className={cn(rowClass, "items-center py-2")}>
            <span className={cn(fieldLabel, "pt-0")}>{t.opsEmail.fromField}</span>
            <span className="min-w-0 flex-1 break-words text-sm font-medium text-foreground/85">
              {selectedFromLabel}
            </span>
          </div>
        ) : (
          <label className={cn(rowClass, "items-center py-2")}>
            <span className={cn(fieldLabel, "pt-0")}>{t.opsEmail.fromField}</span>
            <select
              value={fromKey}
              onChange={(event) => onFromKeyChange(event.target.value)}
              disabled={sending}
              className="h-8 min-w-0 flex-1 cursor-pointer rounded-lg border-0 bg-transparent px-0 text-sm font-medium text-foreground/85 outline-none focus:ring-0"
            >
              {fromOptions.map((row) => (
                <option key={row.key} value={row.key}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
        )
      ) : null}

      <div className={rowClass}>
        <span className={fieldLabel}>{t.opsEmail.toField}</span>
        <OpsComposeParaRecipientField
          emails={toEmails}
          onChange={onToChange}
          disabled={sending}
          inputRef={toInputRef}
        />
        <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
          <button
            type="button"
            onClick={onShowCcRow}
            className="rounded-md px-1.5 py-1 text-xs font-medium text-foreground/45 hover:bg-surface-muted hover:text-foreground"
          >
            {t.opsEmail.ccField}
          </button>
          <button
            type="button"
            onClick={onFocusToInput}
            className="rounded-md p-1 text-foreground/45 hover:bg-surface-muted hover:text-foreground"
            aria-label={t.opsEmail.addRecipient}
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showCcRow ? (
        <div className={rowClass}>
          <span className={fieldLabel}>{t.opsEmail.ccField}</span>
          <OpsComposeParaRecipientField
            emails={ccEmails}
            onChange={onCcChange}
            disabled={sending}
            inputRef={ccInputRef}
          />
        </div>
      ) : null}

      {showSubjectRow ? (
        <label className={cn(rowClass, "items-center py-2")}>
          <span className={cn(fieldLabel, "pt-0")}>{t.opsEmail.subject}</span>
          <input
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
            placeholder={t.opsEmail.subjectPlaceholderMessage}
            maxLength={200}
            disabled={sending}
            className={cn(
              inputClass,
              "h-8 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm focus:ring-0",
            )}
          />
        </label>
      ) : null}
    </div>
  );
}
