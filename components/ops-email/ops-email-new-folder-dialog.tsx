"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { createOpsEmailLabelAction } from "@/lib/dashboard/ops-mailbox-actions";
import { opsEmailTone } from "@/lib/ops-email/messages-tone";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

export const FOLDER_COLOR_PRESETS = [
  "#5D87FF",
  "#0f766e",
  "#9333ea",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#64748b",
] as const;

export function OpsEmailNewFolderDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(FOLDER_COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await createOpsEmailLabelAction(name, color);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setName("");
    onCreated?.();
    onClose();
  }

  return (
    <Dialog
      open={open}
      title={t.opsEmail.newFolder}
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
            disabled={saving || !name.trim()}
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
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-foreground">{t.opsEmail.folderName}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand-400"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {FOLDER_COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={preset}
              onClick={() => setColor(preset)}
              className={cn(
                "h-8 w-8 rounded-lg border-2",
                color === preset ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </Dialog>
  );
}
