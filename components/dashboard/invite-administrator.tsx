"use client";

import { useActionState, useState, type FormEvent } from "react";
import {
  ALLOWED_EMAIL_DOMAIN,
  isAllowedStaffEmailDomain,
  PLATFORM_STAFF_INVITER_EMAIL,
} from "@/lib/auth/policy";
import {
  inviteAdministratorAction,
  type InviteAdministratorState,
} from "@/lib/auth/invite-actions";

type InviteAdministratorProps = {
  canInvite: boolean;
};

export function InviteAdministrator({
  canInvite,
}: InviteAdministratorProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState<
    InviteAdministratorState,
    FormData
  >(inviteAdministratorAction, null);

  const disabled = !canInvite;
  const error = localError ?? state?.error ?? null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    if (!isAllowedStaffEmailDomain(email)) {
      setLocalError(`Only @${ALLOWED_EMAIL_DOMAIN} addresses are accepted.`);
      return;
    }

    setLocalError(null);
    formAction(data);
  }

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-surface p-5 sm:p-6 dark:border-brand-900/50 dark:from-brand-950/30 dark:to-surface ${
        canInvite ? "" : "opacity-55"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white ${
            canInvite ? "bg-brand-600" : "bg-surface-muted text-foreground/35"
          }`}
        >
          <UserPlusIcon />
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-foreground">Invite an administrator</h2>
          <p className="text-sm font-medium text-foreground/60">
            {canInvite
              ? "Invite a new member to join our team."
              : `Only ${PLATFORM_STAFF_INVITER_EMAIL} can send invitations.`}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-3"
      >
        <input
          id="invite-email"
          name="email"
          type="email"
          value={email}
          autoComplete="off"
          required={canInvite}
          disabled={disabled || pending}
          placeholder={`email@${ALLOWED_EMAIL_DOMAIN}`}
          aria-label="Invite an administrator"
          onChange={(event) => {
            setEmail(event.target.value);
            setLocalError(null);
          }}
          className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition-all focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-0 sm:max-w-md sm:flex-1 sm:text-base"
        />
        <button
          type="submit"
          disabled={disabled || pending || !email.trim()}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-brand-600 bg-brand-600 px-5 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusIcon />
          {pending ? "Sending…" : "Send invitation"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-sm font-medium text-error">{error}</p>
      ) : null}
      {state?.message ? (
        <p className="mt-3 text-sm font-medium text-success">{state.message}</p>
      ) : null}

      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-foreground/65">
        <ShieldCheckIcon />
        Invites are protected
      </p>
    </section>
  );
}

function UserPlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19 8v6M22 11h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300"
    >
      <path
        d="M12 3 20 7v6c0 4-2.5 7.5-8 9-5.5-1.5-8-5-8-9V7l8-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
