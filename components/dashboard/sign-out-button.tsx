"use client";

import { signOutAction } from "@/lib/auth/actions";

export function SignOutButton({
  variant = "default",
  label = "Sign out",
}: {
  variant?: "default" | "drawer";
  /** Button label — pass a translated string from the message catalog. */
  label?: string;
}) {
  const drawer = variant === "drawer";

  return (
    <form action={signOutAction} className={drawer ? "w-full" : undefined}>
      <button
        type="submit"
        className={
          drawer
            ? "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[20px] border border-[#d94848] bg-transparent px-4 text-sm font-semibold text-[#d94848] transition-colors hover:bg-[#d94848]/14"
            : "inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
        }
      >
        {drawer ? <LogoutIcon /> : null}
        {label}
      </button>
    </form>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M8 17l-5-5 5-5M3 12h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
