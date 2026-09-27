"use client";

import { useActionState, useState } from "react";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import {
  confirmMfaEnrollmentAction,
  disableMfaAction,
  startMfaEnrollmentAction,
  type MfaEnrollState,
  type MfaSimpleState,
} from "@/lib/auth/mfa-actions";

/**
 * Two-factor (TOTP) control for the signed-in ops user.
 *
 * `enrolled` comes from the server (a Server Component reads the factor list),
 * so there is no client-side status fetch. States:
 *   - not enrolled → "Turn on two-factor" reveals a QR code + secret.
 *   - enrolling    → 6-digit code input; the factor stays UNVERIFIED until
 *                    confirmed, so an abandoned attempt cannot lock anyone out.
 *   - enrolled     → verified badge + "Turn off" (requires a fresh aal2 session).
 *
 * Recovery is admin-assisted on purpose: if a phone is lost, another ops admin
 * clears the factor from Access control. See docs/security.md.
 */
export function MfaSettings({
  enrolled,
  factorId,
}: {
  enrolled: boolean;
  factorId: string | null;
}) {
  const [enrollState, startAction, startPending] = useActionState<
    MfaEnrollState,
    FormData
  >(startMfaEnrollmentAction, null);
  const [confirmState, confirmAction, confirmPending] = useActionState<
    MfaSimpleState,
    FormData
  >(confirmMfaEnrollmentAction, null);
  const [disableState, disableAction, disablePending] = useActionState<
    MfaSimpleState,
    FormData
  >(disableMfaAction, null);

  const [showDisable, setShowDisable] = useState(false);

  // A confirmed enrollment means the account is now protected.
  const isEnrolled = enrolled || Boolean(confirmState?.ok);
  const enrolling = enrollState?.ok === true;

  return (
    <div className="rounded-lg px-3 py-3">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-3 text-sm font-medium text-foreground">
          {isEnrolled ? (
            <ShieldCheck size={18} className="text-success" aria-hidden />
          ) : (
            <ShieldOff size={18} className="text-foreground/50" aria-hidden />
          )}
          Two-factor authentication
        </span>

        {isEnrolled ? (
          !showDisable ? (
            <button
              type="button"
              onClick={() => setShowDisable(true)}
              className="rounded-lg text-xs font-semibold text-foreground/60 transition-colors hover:text-foreground"
            >
              Turn off
            </button>
          ) : null
        ) : !enrolling ? (
          <form action={startAction}>
            <button
              type="submit"
              disabled={startPending}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            >
              {startPending ? <Loader2 size={13} className="animate-spin" /> : null}
              Turn on two-factor
            </button>
          </form>
        ) : null}
      </div>

      {!isEnrolled && !enrolling ? (
        <p className="mt-1.5 text-xs text-foreground/50">
          Recommended — protects the ops console if your password leaks.
        </p>
      ) : null}

      {enrollState?.ok === false ? (
        <p className="mt-2 text-xs font-medium text-error">{enrollState.error}</p>
      ) : null}

      {/* Enrollment: QR + secret + confirm */}
      {enrolling && enrollState?.ok ? (
        <div className="mt-3 rounded-xl border border-border bg-surface-muted/50 p-3">
          <p className="text-xs font-medium text-foreground/70">
            Scan this with your authenticator app, then enter the 6-digit code it
            shows.
          </p>
          <div className="mt-3 flex flex-col items-center gap-3">
            {/* Supabase returns SVG markup for the QR code. */}
            <div
              className="rounded-lg bg-white p-2"
              dangerouslySetInnerHTML={{ __html: enrollState.qrCode }}
            />
            <p className="text-center text-[11px] text-foreground/50">
              Can&apos;t scan? Enter this key manually:
              <br />
              <span className="font-mono text-[11px] break-all text-foreground/70">
                {enrollState.secret}
              </span>
            </p>
          </div>

          <form action={confirmAction} className="mt-3 flex items-center gap-2">
            <input type="hidden" name="factorId" value={enrollState.factorId} />
            <input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              placeholder="000000"
              aria-label="Verification code"
              className="h-9 w-28 rounded-lg border border-border bg-surface px-3 text-sm tracking-[0.2em] text-foreground outline-none transition-colors focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/15"
            />
            <button
              type="submit"
              disabled={confirmPending}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            >
              {confirmPending ? <Loader2 size={13} className="animate-spin" /> : null}
              Confirm
            </button>
          </form>
          {confirmState?.error ? (
            <p className="mt-2 text-xs font-medium text-error">{confirmState.error}</p>
          ) : null}
        </div>
      ) : null}

      {confirmState?.ok ? (
        <p className="mt-2 text-xs font-medium text-success">{confirmState.ok}</p>
      ) : null}

      {/* Disable: only from a fresh aal2 session (enforced server-side). */}
      {isEnrolled && showDisable && factorId ? (
        <form action={disableAction} className="mt-3 rounded-xl bg-error-subtle/50 p-3">
          <input type="hidden" name="factorId" value={factorId} />
          <p className="text-xs font-medium text-foreground/70">
            Turn off two-factor? Your account will only need a password to sign in.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={disablePending}
              className="inline-flex items-center gap-2 rounded-lg bg-error px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            >
              {disablePending ? <Loader2 size={13} className="animate-spin" /> : null}
              Turn off
            </button>
            <button
              type="button"
              onClick={() => setShowDisable(false)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-foreground/60 transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {disableState?.error ? (
        <p className="mt-2 text-xs font-medium text-error">{disableState.error}</p>
      ) : null}
      {disableState?.ok ? (
        <p className="mt-2 text-xs font-medium text-success">{disableState.ok}</p>
      ) : null}
    </div>
  );
}
