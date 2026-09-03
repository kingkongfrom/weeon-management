"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="card rounded-3xl p-8">
        <h1 className="text-2xl font-bold">Platform sign in</h1>
        <p className="mt-1 text-sm text-ink-2/70">
          Internal Weeon staff only. School administrators sign in at the ERP
          (weeon-admin), not here.
        </p>

        <form className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Staff email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              className="rounded-xl border border-line-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="staff@weeon.school"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="rounded-xl border border-line-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
            />
          </label>
          <p className="text-xs text-ink-2/60">
            Skeleton — platform auth mapping to a dedicated staff role is the
            first build task (see docs/architecture.md °Auth & authorization).
          </p>
          <button
            type="submit"
            disabled
            className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white opacity-60"
          >
            Sign in (coming with auth wiring)
          </button>
        </form>

        <Link
          href="/"
          className="mt-5 inline-block text-sm text-ink-2/60 hover:underline"
        >
          ‹ Back
        </Link>
      </div>
    </main>
  );
}
