"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { saveOpsAutoReplyAction } from "@/lib/dashboard/ops-mailbox-actions";
import type { OpsMailboxSettings } from "@/lib/platform/ops-mailbox-settings";
import { opsEmailTone } from "@/lib/ops-email/messages-tone";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

export function OpsEmailAutoReplyDialog({
  open,
  settings,
  onClose,
  onSaved,
}: {
  open: boolean;
  settings: OpsMailboxSettings;
  onClose: () => void;
  onSaved?: (next: OpsMailboxSettings) => void;
}) {
  const t = useT();
  const [enabled, setEnabled] = useState(settings.autoReplyEnabled);
  const [start, setStart] = useState(settings.autoReplyStart ?? "");
  const [end, setEnd] = useState(settings.autoReplyEnd ?? "");
  const [text, setText] = useState(settings.autoReplyText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEnabled(settings.autoReplyEnabled);
    setStart(settings.autoReplyStart ?? "");
    setEnd(settings.autoReplyEnd ?? "");
    setText(settings.autoReplyText);
    setError(null);
  }, [open, settings]);

  async function submit() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await saveOpsAutoReplyAction({
      enabled,
      start: start.trim() || null,
      end: end.trim() || null,
      text,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSaved?.({
      ...settings,
      autoReplyEnabled: enabled,
      autoReplyStart: start.trim() || null,
      autoReplyEnd: end.trim() || null,
      autoReplyText: text.trim(),
    });
    onClose();
  }

  return (
    <Dialog
      open={open}
      title={t.opsEmail.autoReplyTitle}
      panelClassName="max-w-2xl"
      onClose={onClose}
      footer={
        <div className="flex w-full justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-border px-4 text-sm font-semibold text-foreground/70"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50",
              opsEmailTone.primaryButton,
            )}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t.common.save}
          </button>
        </div>
      }
    >
      <label className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        {t.opsEmail.autoReplyEnabled}
      </label>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-foreground/70">Start</span>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-foreground/70">End</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t.opsEmail.autoReplyMessage}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
      </label>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </Dialog>
  );
}
