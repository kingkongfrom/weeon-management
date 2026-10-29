"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changeOwnPassword, type ChangePasswordState } from "@/lib/auth/account-password-actions";

/**
 * In-app password change for Ops staff, opened from the account drawer.
 *
 * Closes the gap between "I know my password" and the email round-trip: the
 * same `passwordSchema` rules as the reset flow, but the current password is
 * verified server-side before `updateUser` runs.
 */
export function ChangePasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(
    changeOwnPassword,
    null,
  );
  const [reveal, setReveal] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  if (!open) return null;

  const fieldClass =
    "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/25";

  return (
    <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-label="Change password">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/45"
      />

      <div className="absolute inset-x-3 top-1/2 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Change password</h2>
            <p className="mt-0.5 text-xs font-medium text-foreground/50">
              At least 8 characters. You will stay signed in.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-foreground/50 hover:bg-surface-muted hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </div>

        {state?.ok ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-200">
              {state.message}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#5e25cc] px-4 text-sm font-semibold text-white hover:bg-[#4b1ea8]"
            >
              Done
            </button>
          </div>
        ) : (
          <form ref={formRef} action={formAction} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-foreground/60">Current password</span>
              <input
                ref={firstRef}
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                disabled={pending}
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-foreground/60">New password</span>
              <input
                name="newPassword"
                type={reveal ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                disabled={pending}
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-foreground/60">Confirm new password</span>
              <input
                name="confirmPassword"
                type={reveal ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                disabled={pending}
                className={fieldClass}
              />
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <input
                type="checkbox"
                checked={reveal}
                onChange={(event) => setReveal(event.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Show passwords
            </label>

            {state && !state.ok ? (
              <p className="rounded-xl bg-error/10 px-3 py-2 text-sm font-medium text-error">{state.error}</p>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="inline-flex h-10 items-center rounded-xl border border-border px-3 text-sm font-semibold text-foreground/70 hover:bg-surface-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#5e25cc] px-4 text-sm font-semibold text-white hover:bg-[#4b1ea8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? <SpinnerIcon /> : null}
                Save password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin">
      <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
