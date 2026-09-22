"use client";

import { signOutAction } from "@/lib/auth/actions";

export function SignOutButton({ variant = "default" }: { variant?: "default" | "drawer" }) {
  const drawer = variant === "drawer";

  return (
    <form action={signOutAction} className={drawer ? "w-full" : undefined}>
      <button
        type="submit"
        className={
          drawer
            ? "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-error px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            : "inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
        }
      >
        {drawer ? <LogoutIcon /> : null}
        Sign out
      </button>
    </form>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
