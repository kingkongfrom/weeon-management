"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { saveOpsSignatureAction } from "@/lib/dashboard/ops-mailbox-actions";
import type { OpsMailboxSettings } from "@/lib/platform/ops-mailbox-settings";
import { opsEmailTone } from "@/lib/ops-email/messages-tone";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

export function OpsEmailSignatureCard({
  initialSettings,
}: {
  initialSettings: OpsMailboxSettings;
}) {
  const t = useT();
  const [text, setText] = useState(initialSettings.signatureText);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await saveOpsSignatureAction(text);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
  }

  return (
    <section
      id="message-signature"
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-foreground">{t.opsEmail.signatureTitle}</h2>
      <p className="mt-1 text-sm text-foreground/60">{t.opsEmail.signatureSettingsDescription}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand-400"
        aria-label={t.opsEmail.signatureTitle}
      />
      <p className="mt-2 text-xs font-medium text-foreground/50">{t.opsEmail.signatureHint}</p>
      <div className="mt-4 flex items-center justify-end gap-3">
        {saved ? (
          <span className="text-sm font-medium text-emerald-600">{t.opsEmail.signatureSaved}</span>
        ) : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onSave()}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50",
            opsEmailTone.primaryButton,
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t.opsEmail.saveSignature}
        </button>
      </div>
    </section>
  );
}
