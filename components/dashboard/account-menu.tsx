"use client";

import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/lib/auth/actions";
import type { DashboardSessionUser } from "@/lib/dashboard/session-types";

export function AccountMenu({
  initials,
  sessionUser,
  className,
}: {
  initials: string;
  sessionUser: DashboardSessionUser | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={className ? `relative ${className}` : "relative"}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="h-9 w-9 overflow-hidden rounded-full brand-gradient outline-none ring-offset-2 ring-offset-surface transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
          {initials}
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface p-1"
        >
          {sessionUser?.name || sessionUser?.email ? (
            <div className="px-3 py-2.5">
              {sessionUser.name ? (
                <p className="truncate text-sm font-semibold text-foreground">
                  {sessionUser.name}
                </p>
              ) : null}
              {sessionUser.email ? (
                <p className="truncate text-xs text-foreground/50">
                  {sessionUser.email}
                </p>
              ) : null}
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[11px] text-foreground/40">Weeon Ops</span>
                <span className="inline-flex items-center rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                  Owner
                </span>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2.5 text-xs text-foreground/50">
              Platform staff
            </div>
          )}
          <div className="my-1 h-px bg-border" />
          <form action={signOutAction} className="p-1">
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-center text-sm font-medium text-foreground/80 transition-colors hover:bg-surface-muted hover:text-error"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
