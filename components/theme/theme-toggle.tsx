"use client";

import { useSyncExternalStore } from "react";
import {
  applyTheme,
  readThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme/theme";

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

function useTheme(initialTheme: ThemePreference): ThemePreference {
  return useSyncExternalStore(
    subscribe,
    readThemePreference,
    () => initialTheme,
  );
}

export function ThemeToggle({
  compact = false,
  initialTheme = "light",
}: {
  compact?: boolean;
  initialTheme?: ThemePreference;
}) {
  const theme = useTheme(initialTheme);
  const isDark = theme === "dark";

  function handleToggle() {
    applyTheme(isDark ? "light" : "dark");
    emit();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground/80 transition-colors hover:bg-surface-muted hover:text-foreground"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Light" : "Dark"}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    );
  }

  const options: Array<{
    value: ThemePreference;
    label: string;
    icon: typeof SunIcon;
  }> = [
    { value: "light", label: "Light", icon: SunIcon },
    { value: "dark", label: "Dark", icon: MoonIcon },
  ];

  return (
    <div
      role="group"
      aria-label="Appearance theme"
      className="inline-flex w-full max-w-xs items-center gap-1 rounded-xl border border-border bg-surface-muted/60 p-1"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = (option.value === "dark") === isDark;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => applyTheme(option.value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              selected
                ? "bg-surface text-foreground shadow-sm ring-1 ring-border"
                : "text-foreground/60 hover:bg-surface/60 hover:text-foreground"
            }`}
            aria-pressed={selected}
          >
            <Icon />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 3v1.5M12 19.5V21M4.2 4.2l1.1 1.1M18.7 18.7l1.1 1.1M3 12h1.5M19.5 12H21M4.2 19.8l1.1-1.1M18.7 5.3l1.1-1.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
