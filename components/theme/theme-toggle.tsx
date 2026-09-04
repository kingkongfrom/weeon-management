"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
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
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    );
  }

  const options: Array<{
    value: ThemePreference;
    label: string;
    icon: typeof Sun;
  }> = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <div
      role="group"
      aria-label="Appearance theme"
      className="relative inline-flex w-full max-w-xs items-center rounded-xl border border-border bg-surface-muted/60 p-1"
    >
      {/* Always-mounted indicator: slides between the two sides in both
          directions, tinted to match each side's theme. */}
      <motion.span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-lg ring-1 ring-black/5 dark:ring-white/10"
        style={{ width: "calc(50% - 4px)", boxShadow: "0 6px 16px rgb(15 23 42 / 0.12)" }}
        initial={false}
        animate={{
          x: isDark ? "100%" : "0%",
          backgroundColor: isDark ? "#1e2a45" : "#ffffff",
        }}
        transition={{ type: "spring", stiffness: 450, damping: 34 }}
      />
      {options.map((option) => {
        const Icon = option.icon;
        const selected = (option.value === "dark") === isDark;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              applyTheme(option.value);
              emit();
            }}
            aria-pressed={selected}
            className="relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
          >
            <span
              className={`flex items-center gap-2 transition-colors ${
                selected
                  ? option.value === "dark"
                    ? "text-[#e8edf5]"
                    : "text-[#1b2433]"
                  : "text-foreground/60"
              }`}
            >
              <Icon size={16} />
              <span>{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}


