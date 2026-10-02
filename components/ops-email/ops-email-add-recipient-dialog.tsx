"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n/client";
import { opsEmailTone } from "@/lib/ops-email/messages-tone";
import { cn } from "@/lib/cn";

export function OpsEmailAddRecipientDialog({
  open,
  title,
  onClose,
  onAdd,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onAdd: (email: string) => void;
}) {
  const t = useT();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const email = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.opsEmail.invalidEmail);
      return;
    }
    onAdd(email);
    setValue("");
    setError(null);
    onClose();
  }

  return (
    <Dialog
      open={open}
      title={title}
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
            onClick={submit}
            className={cn(
              "h-10 rounded-xl px-4 text-sm font-semibold text-white",
              opsEmailTone.primaryButton,
            )}
          >
            {t.common.save}
          </button>
        </div>
      }
    >
      <input
        type="email"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        placeholder="nombre@colegio.edu.cr"
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand-400"
        autoFocus
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </Dialog>
  );
}
