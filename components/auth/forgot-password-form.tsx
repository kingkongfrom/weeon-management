"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AmbientPage } from "@/components/brand/ambient-page";
import { forgotPasswordAction, type ResetState } from "@/lib/auth/actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    forgotPasswordAction,
    {},
  );

  return (
    <AmbientPage>
      <div className="login-card rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="mt-2 text-sm">
          Enter your email and we will send a reset link.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-5">
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
              className="login-field h-8 rounded-lg border px-2.5 text-sm outline-none transition-all"
              placeholder="staff@weeon.school"
            />
          </div>

          {state?.message ? (
            <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-50">
              {state.message}
            </div>
          ) : null}

          {state?.error ? (
            <div className="rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
              {state.error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="brand-gradient inline-flex h-10 w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending link…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs font-medium text-white/55">
          <Link href="/" className="transition-colors hover:text-white">
            Back to sign in
          </Link>
        </p>
      </div>
    </AmbientPage>
  );
}
