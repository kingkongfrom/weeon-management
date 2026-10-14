"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Send, Trash2 } from "lucide-react";
import { OpsEmailActionBar } from "@/components/ops-email/ops-email-action-bar";
import { OpsEmailAttachmentStrip } from "@/components/ops-email/ops-email-attachment-strip";
import {
  OpsComposeEmailFields,
  type OpsFromOption,
} from "@/components/ops-email/ops-compose-email-fields";
import {
  OpsComposeThreadQuotedSection,
  OpsComposeThreadReadPhase,
} from "@/components/ops-email/ops-compose-thread-read-phase";
import { OpsMessageBodyEditor } from "@/components/ops-email/ops-message-body-editor";
import { docHasContent, emptyDoc, type RichTextDoc } from "@/lib/comms/model";
import { sendOpsRichEmailAction } from "@/lib/dashboard/ops-rich-email-actions";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { ensureForwardSubject } from "@/lib/ops-email/compose-display-utils";
import {
  loadOpsComposeDraft,
  removeOpsComposeDraft,
  upsertOpsComposeDraft,
} from "@/lib/ops-email/compose-drafts";
import type { OpsComposeInitial } from "@/lib/ops-email/reply-compose";
import { opsEmailTone } from "@/lib/ops-email/messages-tone";

const OPS_EMAIL = "/dashboard/email";
const MAX_ATTACHMENTS = 10;

export type { OpsFromOption };

export function OpsEmailCompose({
  initial = null,
  replyAllSeed = null,
  expandReplyAll = false,
  fromOptions = [],
  defaultFromKey = "",
  draftId = null,
}: {
  initial?: OpsComposeInitial | null;
  replyAllSeed?: OpsComposeInitial | null;
  expandReplyAll?: boolean;
  fromOptions?: OpsFromOption[];
  defaultFromKey?: string;
  draftId?: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);

  const sourceHistory = initial?.sourceHistory ?? [];
  const hasThreadReadPhase = sourceHistory.length > 0;

  const threadSeedRef = useRef({
    reply: { to: initial?.to ?? [], cc: [] as string[] },
    replyAll: {
      to: replyAllSeed?.to ?? initial?.to ?? [],
      cc: replyAllSeed?.cc ?? initial?.cc ?? [],
    },
  });

  const [toEmails, setToEmails] = useState<string[]>(() => initial?.to ?? []);
  const [ccEmails, setCcEmails] = useState<string[]>(() => initial?.cc ?? []);
  const [ccRowVisible, setCcRowVisible] = useState(() => (initial?.cc?.length ?? 0) > 0);
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
  const [replyExpanded, setReplyExpanded] = useState(
    !hasThreadReadPhase || expandReplyAll,
  );
  const draftIdRef = useRef<string | null>(draftId);
  const skipDraftRef = useRef(false);
  const sentRef = useRef(false);

  function expandReply(mode: "reply" | "reply-all") {
    const seed = mode === "reply-all" ? threadSeedRef.current.replyAll : threadSeedRef.current.reply;
    setToEmails(seed.to);
    setCcEmails(seed.cc);
    setReplyExpanded(true);
  }

  useEffect(() => {
    if (!expandReplyAll || !hasThreadReadPhase) return;
    const seed = threadSeedRef.current.replyAll;
    setToEmails(seed.to);
    setCcEmails(seed.cc);
    setReplyExpanded(true);
  }, [expandReplyAll, hasThreadReadPhase]);

  function expandForward() {
    setToEmails([]);
    setCcEmails([]);
    setSubject((current) => ensureForwardSubject(current));
    setReplyExpanded(true);
  }

  useEffect(() => {
    if (!draftId || initial?.inboundId || initial?.outboundId || hasThreadReadPhase) return;
    const stored = loadOpsComposeDraft(draftId);
    if (!stored) return;
    setToEmails(stored.to);
    setCcEmails(stored.cc);
    setCcRowVisible(stored.cc.length > 0);
    setSubject(stored.subject);
    setBody(stored.body);
    setAllowReplies(stored.allowReplies);
    if (stored.fromKey && fromOptions.some((row) => row.key === stored.fromKey)) {
      setFromKey(stored.fromKey);
    }
  }, [draftId, initial?.inboundId, initial?.outboundId, hasThreadReadPhase]);

  const snapRef = useRef({
    to: toEmails,
    cc: ccEmails,
    subject,
    body,
    allowReplies,
    fromKey,
  });
  snapRef.current = {
    to: toEmails,
    cc: ccEmails,
    subject,
    body,
    allowReplies,
    fromKey,
  };

  const persistRef = useRef<() => void>(() => {});
  persistRef.current = () => {
    if (skipDraftRef.current || sentRef.current) return;
    const snap = snapRef.current;
    const id = draftIdRef.current ?? crypto.randomUUID();
    const saved = upsertOpsComposeDraft({
      id,
      to: snap.to,
      cc: snap.cc,
      subject: snap.subject,
      body: snap.body,
      allowReplies: snap.allowReplies,
      fromKey: snap.fromKey,
    });
    draftIdRef.current = saved;
  };

  useEffect(() => {
    const timer = window.setTimeout(() => persistRef.current(), 700);
    return () => window.clearTimeout(timer);
  }, [toEmails, ccEmails, subject, body, allowReplies, fromKey]);

  useEffect(
    () => () => {
      persistRef.current();
    },
    [],
  );

  function saveDraftLocal() {
    persistRef.current();
    setNotice(t.opsEmail.draftSaved);
    window.setTimeout(() => setNotice(null), 2500);
  }

  function discardDraft() {
    skipDraftRef.current = true;
    if (draftIdRef.current) removeOpsComposeDraft(draftIdRef.current);
    router.push(`${OPS_EMAIL}?folder=drafts`);
  }

  function addFiles(incoming: FileList | File[]) {
    const picked = Array.from(incoming);
    if (picked.length === 0) return;
    setCloudError(null);
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

  const sendDisabled =
    sending || !canSend || (hasThreadReadPhase && !replyExpanded);

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
    sentRef.current = true;
    if (draftIdRef.current) removeOpsComposeDraft(draftIdRef.current);
    router.push(`${OPS_EMAIL}?folder=sent`);
    router.refresh();
  }

  const toolbarBtn =
    "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors sm:px-3";

  const composeFields = (
    <>
      <OpsComposeEmailFields
        fromOptions={fromOptions}
        fromKey={fromKey}
        onFromKeyChange={setFromKey}
        toEmails={toEmails}
        ccEmails={ccEmails}
        onToChange={setToEmails}
        onCcChange={setCcEmails}
        subject={subject}
        onSubjectChange={setSubject}
        showCcRow={ccRowVisible || ccEmails.length > 0}
        onShowCcRow={() => {
          setCcRowVisible(true);
          window.setTimeout(() => ccInputRef.current?.focus(), 0);
        }}
        onFocusToInput={() => toInputRef.current?.focus()}
        toInputRef={toInputRef}
        ccInputRef={ccInputRef}
        sending={sending}
      />
      <OpsMessageBodyEditor
        value={body}
        onChange={setBody}
        placeholder={t.opsEmail.bodyPlaceholderMessage}
        disabled={sending}
        editorClassName="min-h-[14rem] border-0"
        className="mt-3"
      />
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0 bg-surface">
      {notice ? (
        <p className="mb-3 rounded-xl bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
          {notice}
        </p>
      ) : null}

      <div className="sticky top-0 z-20 -mx-1 overflow-visible border-b border-border/60 bg-surface/95 px-1 py-2.5 backdrop-blur-sm sm:-mx-2 sm:px-2">
        <div className="flex flex-wrap items-center gap-2 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1 sm:gap-2">
            <Link
              href={OPS_EMAIL}
              className={cn(
                toolbarBtn,
                "text-foreground/65 hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t.opsEmail.back}</span>
            </Link>
            <button
              type="button"
              onClick={discardDraft}
              className={cn(toolbarBtn, "text-error/90 hover:bg-error/5")}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t.opsEmail.discard}</span>
            </button>
            <button
              type="button"
              onClick={saveDraftLocal}
              className={cn(
                toolbarBtn,
                "text-foreground/65 hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <Save className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t.opsEmail.saveDraft}</span>
            </button>
          </div>

          <div className="min-w-3 flex-1" aria-hidden />

          {hasThreadReadPhase && !replyExpanded ? (
            <OpsEmailActionBar
              onReply={() => expandReply("reply")}
              onReplyAll={() => expandReply("reply-all")}
              onForward={() => expandForward()}
            />
          ) : null}

          {hasThreadReadPhase && !replyExpanded ? null : (
            <button
              type="button"
              onClick={() => void send()}
              disabled={sendDisabled}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45",
                opsEmailTone.primaryButton,
              )}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? t.opsEmail.sending : t.opsEmail.sendMessage}
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto pt-4">
        {hasThreadReadPhase ? (
          <OpsComposeThreadReadPhase
            subject={subject}
            messages={sourceHistory}
            deferQuotedThread={replyExpanded}
            replyEditor={replyExpanded ? composeFields : null}
          />
        ) : replyExpanded ? (
          composeFields
        ) : null}

        {replyExpanded ? (
          <>
            <OpsEmailAttachmentStrip
              allowReplies={allowReplies}
              onAllowRepliesChange={setAllowReplies}
              files={files}
              onRemoveFile={(index) => setFiles((current) => current.filter((_, i) => i !== index))}
              onAddFiles={addFiles}
              sending={sending}
              remainingAttachmentSlots={remainingAttachmentSlots}
              cloudError={cloudError}
              onCloudError={setCloudError}
              fileInputRef={fileInputRef}
            />

            {error ? (
              <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
                {error}
              </p>
            ) : null}

            {hasThreadReadPhase && replyExpanded ? (
              <OpsComposeThreadQuotedSection
                messages={sourceHistory}
                subject={subject}
                replying
              />
            ) : null}
          </>
        ) : null}
      </div>

    </div>
  );
}
