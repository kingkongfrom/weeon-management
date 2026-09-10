"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Loader2, Trash2, TriangleAlert } from "lucide-react";
import {
  removeTenantAdministratorAction,
  type RemoveAdministratorState,
} from "@/lib/dashboard/tenant-admin-actions";

export function RemoveAdministratorButton({
  tenantId,
  profileId,
  name,
}: {
  tenantId: string;
  profileId: string;
  name: string;
}) {
  const [state, action, pending] = useActionState<
    RemoveAdministratorState,
    FormData
  >(removeTenantAdministratorAction, null);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [open]);

  if (state?.ok) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
        <Check size={12} />
        Removed
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Remove ${name}`}
        title={`Remove ${name}`}
        className="grid h-7 w-7 place-items-center rounded-md text-foreground/40 transition-colors hover:bg-error-subtle hover:text-error"
      >
        <Trash2 size={14} />
      </button>

      {open ? (
        <dialog
          ref={dialogRef}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === dialogRef.current) dialogRef.current?.close();
          }}
          aria-labelledby={`remove-admin-title-${profileId}`}
          className="fixed inset-0 z-50 m-auto h-fit w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/50"
        >
          <form action={action} className="p-5">
            <input type="hidden" name="tenantId" value={tenantId} />
            <input type="hidden" name="profileId" value={profileId} />

            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-error-subtle text-error">
                <TriangleAlert size={18} />
              </span>
              <div className="min-w-0">
                <h2
                  id={`remove-admin-title-${profileId}`}
                  className="text-base font-bold text-foreground"
                >
                  Remove administrator?
                </h2>
                <p className="mt-1 text-sm text-foreground/60">
                  <span className="font-semibold text-foreground">{name}</span>{" "}
                  will lose all access to this school immediately. Their login is
                  not deleted, but they will no longer be an administrator here.
                </p>
              </div>
            </div>

            {state?.error ? (
              <p className="mt-4 rounded-lg bg-error-subtle px-3 py-2 text-sm font-medium text-error">
                {state.error}
              </p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                disabled={pending}
                className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:bg-surface-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg bg-error px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Remove administrator
              </button>
            </div>
          </form>
        </dialog>
      ) : null}
    </>
  );
}
