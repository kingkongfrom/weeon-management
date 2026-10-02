"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { saveOpsSignatureAction } from "@/lib/dashboard/ops-mailbox-actions";
import type { OpsMailboxSettings } from "@/lib/platform/ops-mailbox-settings";
import { opsEmailTone } from "@/lib/ops-email/messages-tone";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

export function OpsEmailSignatureDialog({
  open,
  settings,
  onClose,
  onSaved,
}: {
  open: boolean;
  settings: OpsMailboxSettings;
  onClose: () => void;
  onSaved?: (signatureText: string) => void;
}) {
  const t = useT();
  const [text, setText] = useState(settings.signatureText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setText(settings.signatureText);
      setError(null);
    }
  }, [open, settings.signatureText]);

  async function submit() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await saveOpsSignatureAction(text);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSaved?.(text.trim());
    onClose();
  }

  return (
    <Dialog
      open={open}
      title={t.opsEmail.signatureTitle}
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
      <p className="mb-3 text-sm text-foreground/60">{t.opsEmail.signatureHint}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand-400"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </Dialog>
  );
}
