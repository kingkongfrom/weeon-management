"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  deleteAdminAccountAction,
  setAdminSuspendedAction,
  type AdminActionState,
} from "@/lib/dashboard/admin-account-actions";
import type { AdminAccount } from "@/lib/platform/access-control";

/**
 * Access actions for a single administrator: suspend (deactivate) / reactivate,
 * and soft delete. Delete is destructive and irreversible from the console, so
 * it requires the word DELETE typed before it will submit.
 *
 * Ops-only surface: these call server actions that enforce the platform session.
 */
export function AdminActions({ account }: { account: AdminAccount }) {
  const [suspendState, suspendAction, suspendPending] = useActionState<
    AdminActionState,
    FormData
  >(setAdminSuspendedAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState<
    AdminActionState,
    FormData
  >(deleteAdminAccountAction, null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const suspended = account.accountStatus === "suspended";

  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/45">
        Access actions
      </p>

      {suspendState?.error || deleteState?.error ? (
        <p className="mt-2 text-xs font-medium text-error">
          {suspendState?.error ?? deleteState?.error}
        </p>
      ) : null}
      {suspendState?.ok || deleteState?.ok ? (
        <p className="mt-2 text-xs font-medium text-success">
          {suspendState?.ok ?? deleteState?.ok}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form action={suspendAction}>
          <input type="hidden" name="profileId" value={account.id} />
          <input type="hidden" name="tenantId" value={account.tenantId} />
          <input type="hidden" name="name" value={account.name} />
          <input type="hidden" name="suspended" value={suspended ? "false" : "true"} />
          <button
            type="submit"
            disabled={suspendPending}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 ${
              suspended
                ? "bg-brand-600 text-white"
                : "border border-border bg-surface text-foreground hover:bg-surface-muted"
            }`}
          >
            {suspendPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {suspended ? "Reactivate" : "Suspend"}
          </button>
        </form>

        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-error/30 bg-error-subtle px-3.5 py-2 text-xs font-semibold text-error transition-colors hover:bg-error/10"
          >
            Delete
          </button>
        ) : null}
      </div>

      {confirmingDelete ? (
        <form action={deleteAction} className="mt-3 rounded-xl bg-error-subtle/60 p-3">
          <input type="hidden" name="profileId" value={account.id} />
          <input type="hidden" name="tenantId" value={account.tenantId} />
          <input type="hidden" name="name" value={account.name} />
          <p className="text-xs font-medium text-foreground/70">
            This deletes <strong>{account.name}</strong> immediately, destroys their
            login, and purges the record after 72 hours. Type{" "}
            <strong>DELETE</strong> to confirm.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="confirm"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="DELETE"
              aria-label="Type DELETE to confirm"
              autoComplete="off"
              className="h-9 w-32 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-error focus:ring-[3px] focus:ring-error/15"
            />
            <button
              type="submit"
              disabled={deletePending || confirmText.toUpperCase() !== "DELETE"}
              className="inline-flex items-center gap-2 rounded-lg bg-error px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            >
              {deletePending ? <Loader2 size={14} className="animate-spin" /> : null}
              Delete permanently
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmingDelete(false);
                setConfirmText("");
              }}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-foreground/60 transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
