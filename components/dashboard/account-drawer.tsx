"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { LogoMark } from "@/components/logo";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { StatusSwitch } from "@/components/ui/status-switch";
import {
  applyTheme,
  readThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme/theme";
import type { DashboardSessionUser } from "@/lib/dashboard/session-types";

const themeListeners = new Set<() => void>();

function subscribeTheme(onStoreChange: () => void) {
  themeListeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    themeListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function emitTheme() {
  for (const listener of themeListeners) listener();
}

function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribeTheme, readThemePreference, () => "light");
}

/**
 * Account drawer — portaled to document.body so header backdrop-blur does not
 * trap position: fixed (same pattern as weeon-tenants).
 */
export function AccountDrawer({
  open,
  onClose,
  initials,
  sessionUser,
}: {
  open: boolean;
  onClose: () => void;
  initials: string;
  sessionUser: DashboardSessionUser | null;
}) {
  const theme = useThemePreference();
  const isDark = theme === "dark";
  const closeRef = useRef<HTMLButtonElement>(null);

  const displayName = sessionUser?.name?.trim() || "Platform staff";
  const roleLabel = sessionUser?.role?.trim() || "Ops administrator";

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  function toggleTheme(checked: boolean) {
    applyTheme(checked ? "dark" : "light");
    emitTheme();
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div key="account-drawer" className="fixed inset-0 z-[100]">
          <motion.button
            type="button"
            aria-label="Close account menu"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Account"
            className="absolute right-0 top-0 flex h-dvh w-full max-w-sm flex-col bg-surface shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="flex items-center border-b border-border px-4 py-3">
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close account menu"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div className="flex items-center gap-4">
                <UserAvatar initials={initials} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-foreground">{displayName}</p>
                  <span className="mt-1 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                    {roleLabel}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3">
                <LogoMark className="h-8 w-8 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">Weeon Ops</p>
                  {sessionUser?.email ? (
                    <p className="truncate text-xs text-foreground/50">{sessionUser.email}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-7 space-y-1 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-4 rounded-lg px-3 py-3">
                  <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                    <MoonIcon />
                    Dark mode
                  </span>
                  <StatusSwitch checked={isDark} onCheckedChange={toggleTheme} showLabel={false} />
                </div>
              </div>
            </div>

            <div className="border-t border-border px-5 py-4">
              <SignOutButton variant="drawer" />
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-foreground/70">
      <path
        d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
