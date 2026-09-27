"use client";

import { Suspense, useActionState, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AmbientPage } from "@/components/brand/ambient-page";
import {
  cancelMfaLoginAction,
  loginAction,
  verifyMfaLoginAction,
  type LoginState,
} from "@/lib/auth/actions";
import { isAllowedStaffEmailDomain } from "@/lib/auth/policy";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  const error = localError ?? state?.error ?? null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    if (!isAllowedStaffEmailDomain(email)) {
      event.preventDefault();
      setLocalError("Only @weeon.school staff can access the ops console.");
      return;
    }
    setLocalError(null);
  }

  // Password accepted, second factor still required.
  if (state?.mfaRequired) {
    return <MfaChallenge error={state.error ?? null} />;
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="next" value="/dashboard" />
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          onChange={() => setLocalError(null)}
          className="login-field h-8 rounded-lg border px-2.5 text-sm outline-none transition-all"
          placeholder="staff@weeon.school"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            onChange={() => setLocalError(null)}
            className="login-field h-8 w-full rounded-lg border pr-10 pl-2.5 text-sm outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/50 transition-colors hover:text-white"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="brand-gradient inline-flex h-10 w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

/** Second-factor step: 6-digit TOTP code from the user's authenticator app. */
function MfaChallenge({ error }: { error: string | null }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    verifyMfaLoginAction,
    {},
  );
  const message = state?.error ?? error;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value="/dashboard" />
      <div className="flex flex-col gap-2">
        <label htmlFor="code" className="text-sm font-semibold">
          Verification code
        </label>
        <p className="text-xs text-white/60">
          Enter the 6-digit code from your authenticator app.
        </p>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          required
          autoFocus
          className="login-field h-8 rounded-lg border px-2.5 text-sm tracking-[0.3em] outline-none transition-all"
          placeholder="000000"
        />
      </div>

      {message ? (
        <div className="rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="brand-gradient inline-flex h-10 w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Verify and sign in"}
      </button>

      <button
        type="button"
        onClick={() => void cancelMfaLoginAction()}
        className="text-center text-xs font-medium text-white/55 transition-colors hover:text-white"
      >
        Cancel and sign out
      </button>
    </form>
  );
}

function LoginNotice() {
  const params = useSearchParams();
  if (params.get("reset") === "done") {
    return (
      <p className="mt-4 mb-0 rounded-xl border border-emerald-300/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-50">
        Password updated. Sign in with your new password.
      </p>
    );
  }
  if (params.get("invited") === "1") {
    return (
      <p className="mt-4 mb-0 rounded-xl border border-emerald-300/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-50">
        Invitation accepted. Sign in to continue.
      </p>
    );
  }
  return null;
}

export function LoginShell() {
  return (
    <AmbientPage>
      <div className="login-card rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm">Welcome back to Weeon Ops.</p>
        <Suspense fallback={null}>
          <LoginNotice />
        </Suspense>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-5 text-center text-xs font-medium text-white/55">
          <Link href="/forgot-password" className="transition-colors hover:text-white">
            Forgot your password?
          </Link>
        </p>
      </div>
    </AmbientPage>
  );
}
