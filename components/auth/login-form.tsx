"use client";

import { Suspense, useActionState, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AmbientPage } from "@/components/brand/ambient-page";
import { loginAction, type LoginState } from "@/lib/auth/actions";
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
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
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

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M9.9 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.3 3.9M6.1 6.1C3.5 8 2 12 2 12s3.5 7 10 7c1.6 0 3-.3 4.3-.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
