"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FolderOpen,
  Loader2,
  Paperclip,
  Save,
  Send,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { OpsCloudImportSources } from "@/components/ops-email/cloud-import-sources";
import { OpsEmailAddRecipientDialog } from "@/components/ops-email/ops-email-add-recipient-dialog";
import { OpsMessageBodyEditor } from "@/components/ops-email/ops-message-body-editor";
import { MESSAGE_ATTACHMENT_ACCEPT } from "@/lib/comms/attachment-mime";
import { docHasContent, emptyDoc, type RichTextDoc } from "@/lib/comms/model";
import { sendOpsRichEmailAction } from "@/lib/dashboard/ops-rich-email-actions";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import type { OpsComposeInitial } from "@/lib/ops-email/reply-compose";
import { opsEmailTone } from "@/lib/ops-email/messages-tone";

const OPS_EMAIL = "/dashboard/email";
const DRAFT_KEY = "weeon-ops-email-compose-draft";
const MAX_ATTACHMENTS = 10;

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/25";

type DraftSnapshot = {
  to: string[];
  cc: string[];
  subject: string;
  body: RichTextDoc;
  allowReplies: boolean;
  fromKey: string;
};

export type OpsFromOption = {
  key: string;
  label: string;
};

export function OpsEmailCompose({
  initial = null,
  fromOptions = [],
  defaultFromKey = "",
}: {
  initial?: OpsComposeInitial | null;
  fromOptions?: OpsFromOption[];
  defaultFromKey?: string;
}) {
  const t = useT();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toEmails, setToEmails] = useState<string[]>(() => initial?.to ?? []);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [pickerTarget, setPickerTarget] = useState<"to" | "cc" | null>(null);
  const [subject, setSubject] = useState(() => initial?.subject ?? "");
  const [body, setBody] = useState<RichTextDoc>(() => initial?.body ?? emptyDoc());
  const [allowReplies, setAllowReplies] = useState(() => initial?.allowReplies ?? false);
  const [fromKey, setFromKey] = useState(
    () => defaultFromKey || fromOptions[0]?.key || "",
  );
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initial?.inboundId || initial?.outboundId) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as DraftSnapshot;
      setToEmails(draft.to ?? []);
      setCcEmails(draft.cc ?? []);
      setSubject(draft.subject ?? "");
      setBody(draft.body ?? emptyDoc());
      setAllowReplies(draft.allowReplies ?? false);
      if (draft.fromKey && fromOptions.some((row) => row.key === draft.fromKey)) {
        setFromKey(draft.fromKey);
      }
    } catch {
      /* ignore */
    }
  }, [
    initial?.inboundId,
    initial?.outboundId,
    initial?.body,
    initial?.subject,
    initial?.to,
    initial?.allowReplies,
    fromOptions,
  ]);

  function saveDraftLocal() {
    const snap: DraftSnapshot = {
      to: toEmails,
      cc: ccEmails,
      subject,
      body,
      allowReplies,
      fromKey,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(snap));
    setNotice(t.opsEmail.draftSaved);
    window.setTimeout(() => setNotice(null), 2500);
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    router.push(OPS_EMAIL);
  }

  function addFiles(incoming: FileList | File[]) {
    const picked = Array.from(incoming);
    setFiles((current) => {
      const merged = [...current];
      for (const file of picked) {
        if (merged.length >= MAX_ATTACHMENTS) break;
        merged.push(file);
      }
      return merged;
    });
  }

  const remainingAttachmentSlots = MAX_ATTACHMENTS - files.length;

  const canSend =
    toEmails.length > 0 && subject.trim().length > 0 && docHasContent(body);

  async function send() {
    if (!canSend || sending) return;
    setSending(true);
    setError(null);

    const attachments = await Promise.all(
      files.map(
        (file) =>
          new Promise<{ filename: string; contentBase64: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
              resolve({ filename: file.name, contentBase64: base64 });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      ),
    );

    const result = await sendOpsRichEmailAction({
      to: toEmails,
      cc: ccEmails,
      subject,
      body,
      fromKey,
      attachments,
    });

    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    localStorage.removeItem(DRAFT_KEY);
    router.push(OPS_EMAIL);
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
      {notice ? (
        <p className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={OPS_EMAIL}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-foreground/60 hover:bg-surface-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.opsEmail.back}
            </Link>
            <button
              type="button"
              onClick={discardDraft}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-error/80 hover:text-error"
            >
              <Trash2 className="h-4 w-4" />
              {t.opsEmail.discard}
            </button>
            <button
              type="button"
              onClick={saveDraftLocal}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-foreground/70 hover:bg-surface-muted hover:text-foreground"
            >
              <Save className="h-4 w-4" />
              {t.opsEmail.saveDraft}
            </button>
          </div>
          <button
            type="button"
            onClick={() => void send()}
            disabled={!canSend || sending}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50",
              opsEmailTone.primaryButton,
            )}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? t.opsEmail.sending : t.opsEmail.sendMessage}
          </button>
        </div>

        <div className="flex flex-col gap-0 px-4 py-4">
          {fromOptions.length > 0 ? (
            <label className="flex flex-wrap items-center gap-3 border-b border-border py-3">
              <span className="w-16 shrink-0 text-sm font-semibold text-foreground/55">
                {t.opsEmail.fromField}
              </span>
              <select
                value={fromKey}
                onChange={(event) => setFromKey(event.target.value)}
                disabled={sending}
                className={cn(inputClass, "max-w-full flex-1 cursor-pointer")}
              >
                {fromOptions.map((row) => (
                  <option key={row.key} value={row.key}>
                    {row.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <RecipientRow
            label={t.opsEmail.toField}
            actionLabel={t.opsEmail.addRecipient}
            onAdd={() => setPickerTarget("to")}
          >
            {toEmails.map((email) => (
              <RecipientChip
                key={email}
                label={email}
                onRemove={() => setToEmails((current) => current.filter((e) => e !== email))}
              />
            ))}
          </RecipientRow>

          <RecipientRow
            label={t.opsEmail.ccField}
            actionLabel={t.opsEmail.addCc}
            onAdd={() => setPickerTarget("cc")}
            muted
          >
            {ccEmails.map((email) => (
              <RecipientChip
                key={email}
                label={email}
                onRemove={() => setCcEmails((current) => current.filter((e) => e !== email))}
              />
            ))}
          </RecipientRow>

          <label className="flex items-center gap-3 border-b border-border py-3">
            <span className="w-16 shrink-0 text-sm font-semibold text-foreground/55">
              {t.opsEmail.subject}
            </span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder={t.opsEmail.subjectPlaceholderMessage}
              maxLength={200}
              className={cn(inputClass, "border-0 bg-transparent px-0 focus:ring-0")}
            />
          </label>

          <OpsMessageBodyEditor
            value={body}
            onChange={setBody}
            placeholder={t.opsEmail.bodyPlaceholderMessage}
            disabled={sending}
          />

          <label className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
            <span className="text-sm font-semibold text-foreground">{t.opsEmail.allowReplies}</span>
            <button
              type="button"
              role="switch"
              aria-checked={allowReplies}
              onClick={() => setAllowReplies((current) => !current)}
              className={cn(
                "inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
                allowReplies ? opsEmailTone.toggleOn : "bg-foreground/20",
              )}
            >
              <span
                className={cn(
                  "block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-out",
                  allowReplies ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </label>

          <div
            className="mt-4 rounded-2xl border border-dashed border-border bg-surface-muted/30 px-6 py-8 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
            }}
          >
            <p className="text-sm font-medium text-foreground/55">{t.opsEmail.dropFilesHint}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-foreground/40">
              {t.opsEmail.importFrom}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                disabled={sending || remainingAttachmentSlots <= 0}
                onClick={() => {
                  setCloudError(null);
                  fileInputRef.current?.click();
                }}
                className="inline-flex min-w-[4.5rem] flex-col items-center gap-1 text-xs font-semibold text-foreground/60 hover:text-foreground disabled:opacity-50"
              >
                <FolderOpen className="h-8 w-8" />
                {t.opsEmail.myDevice}
              </button>
              <OpsCloudImportSources
                remainingSlots={remainingAttachmentSlots}
                disabled={sending}
                onLocalFiles={addFiles}
                onError={setCloudError}
              />
            </div>
            {cloudError ? (
              <p className="mt-3 text-xs font-medium text-error">{cloudError}</p>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={MESSAGE_ATTACHMENT_ACCEPT}
              className="hidden"
              disabled={sending || remainingAttachmentSlots <= 0}
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            {files.length > 0 ? (
              <ul className="mt-4 space-y-2 text-left">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <Paperclip className="h-4 w-4 shrink-0 text-foreground/40" />
                      <span className="truncate font-medium">{file.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                      className="text-foreground/40 hover:text-error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {error ? (
            <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <OpsEmailAddRecipientDialog
        open={pickerTarget === "to"}
        title={t.opsEmail.addRecipient}
        onClose={() => setPickerTarget(null)}
        onAdd={(email) => setToEmails((current) => (current.includes(email) ? current : [...current, email]))}
      />
      <OpsEmailAddRecipientDialog
        open={pickerTarget === "cc"}
        title={t.opsEmail.addCc}
        onClose={() => setPickerTarget(null)}
        onAdd={(email) => setCcEmails((current) => (current.includes(email) ? current : [...current, email]))}
      />
    </div>
  );
}

function RecipientRow({
  label,
  actionLabel,
  onAdd,
  muted = false,
  children,
}: {
  label: string;
  actionLabel: string;
  onAdd: () => void;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-3 border-b border-border py-3",
        muted && "opacity-90",
      )}
    >
      <span className="w-16 shrink-0 pt-1.5 text-sm font-semibold text-foreground/55">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {children}
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-brand-400/35 bg-brand-50/90 px-3.5 text-sm font-semibold text-brand-600 hover:bg-brand-100/90 dark:bg-brand-950/40 dark:text-brand-300"
        >
          <UserPlus className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function RecipientChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
      <span className="truncate text-xs font-semibold text-foreground/80">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-5 w-5 items-center justify-center rounded-full text-foreground/40 hover:bg-error/10 hover:text-error"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
