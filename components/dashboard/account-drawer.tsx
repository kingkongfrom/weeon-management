"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { LogoMark } from "@/components/logo";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { MfaSettings } from "@/components/dashboard/mfa-settings";
import { StatusSwitch } from "@/components/ui/status-switch";
import {
  applyTheme,
  readThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme/theme";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { useLocale, useSetLocale, useT } from "@/lib/i18n/client";
import { readAvatarFile, writeAvatarPreference } from "@/lib/profile/preferences";
import {
  emitProfilePreferences,
  useAvatarPreference,
} from "@/lib/profile/use-profile-preferences";
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
  mfaEnrolled = false,
  mfaFactorId = null,
}: {
  open: boolean;
  onClose: () => void;
  initials: string;
  sessionUser: DashboardSessionUser | null;
  mfaEnrolled?: boolean;
  mfaFactorId?: string | null;
}) {
  const theme = useThemePreference();
  const isDark = theme === "dark";
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarUrl = useAvatarPreference();
  const locale = useLocale();
  const setLocale = useSetLocale();
  const t = useT();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const displayName = sessionUser?.name?.trim() || t.drawer.nameFallback;
  const roleLabel = sessionUser?.role?.trim() || t.drawer.roleFallback;

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

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    setAvatarError(null);
    setSavingAvatar(true);
    try {
      const dataUrl = await readAvatarFile(file);
      writeAvatarPreference(dataUrl);
      emitProfilePreferences();
    } catch {
      setAvatarError(t.drawer.photoError);
    } finally {
      setSavingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onRemoveAvatar() {
    writeAvatarPreference("");
    emitProfilePreferences();
  }

  function chooseLocale(next: Locale) {
    setLocale(next);
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
            aria-label={t.drawer.ariaSettings}
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
                aria-label={t.drawer.ariaClose}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={savingAvatar}
                  aria-label={
                    avatarUrl ? t.drawer.changePhoto : t.drawer.uploadPhoto
                  }
                  title={avatarUrl ? t.drawer.changePhoto : t.drawer.uploadPhoto}
                  className="group relative shrink-0 rounded-2xl outline-none ring-offset-2 ring-offset-surface transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  <UserAvatar initials={initials} src={avatarUrl} size="md" />
                  {savingAvatar ? (
                    <span
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/45"
                    >
                      <SpinnerIcon />
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      <CameraIcon />
                    </span>
                  )}
                </button>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-foreground">{displayName}</p>
                  <span className="mt-1 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                    {roleLabel}
                  </span>
                  {avatarUrl ? (
                    <button
                      type="button"
                      onClick={onRemoveAvatar}
                      className="ml-2 rounded-full text-[11px] font-semibold text-foreground/50 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {t.drawer.removePhoto}
                    </button>
                  ) : null}
                  {avatarError ? (
                    <p className="mt-1 text-[11px] font-medium text-danger">{avatarError}</p>
                  ) : null}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onPickAvatar(event.target.files?.[0] ?? null)}
                />
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3">
                <LogoMark className="h-8 w-8 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {t.drawer.orgName}
                  </p>
                  {sessionUser?.email ? (
                    <p className="truncate text-xs text-foreground/50">{sessionUser.email}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-7 space-y-1 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-4 rounded-lg px-3 py-3">
                  <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                    <GlobeIcon />
                    {t.drawer.language}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {LOCALES.map((option) => {
                      const selected = locale === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => chooseLocale(option.value)}
                          className={
                            selected
                              ? "rounded-full border border-[#2b59ff] bg-[#2b59ff]/15 px-2.5 py-1 text-xs font-bold text-[#2b59ff]"
                              : "rounded-full border border-border px-2.5 py-1 text-xs font-bold text-foreground/80"
                          }
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg px-3 py-3">
                  <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                    <MoonIcon />
                    {t.drawer.darkMode}
                  </span>
                  <StatusSwitch checked={isDark} onCheckedChange={toggleTheme} showLabel={false} />
                </div>
                <MfaSettings enrolled={mfaEnrolled} factorId={mfaFactorId} />
              </div>
            </div>

            <div className="border-t border-border px-5 py-4">
              <p className="mb-3 text-center text-xs font-medium text-foreground/45">
                {t.drawer.version("0.1.0")}
              </p>
              <SignOutButton variant="drawer" label={t.signOut.label} />
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

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-foreground/70">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-white">
      <path
        d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="animate-spin text-white"
    >
      <path
        d="M12 3a9 9 0 1 0 9 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
