export type IconTone =
  | "brand"
  | "accent"
  | "success"
  | "warning"
  | "error";

/**
 * Decorative icon chip colors for dashboard tiles and stat cards.
 * Wired to `--icon-*` tokens in `app/globals.css` (same as weeon-tenants).
 */
export const ICON_TONE_CLASSES: Record<IconTone, string> = {
  brand:
    "bg-icon-brand-bg text-icon-brand-fg group-hover:bg-[var(--icon-brand-bg-hover)]",
  accent:
    "bg-icon-accent-bg text-icon-accent-fg group-hover:bg-[var(--icon-accent-bg-hover)]",
  success:
    "bg-icon-accent-bg text-icon-accent-fg group-hover:bg-[var(--icon-accent-bg-hover)]",
  warning:
    "bg-icon-brand-bg text-icon-brand-fg group-hover:bg-[var(--icon-brand-bg-hover)]",
  error:
    "bg-icon-brand-bg text-icon-brand-fg group-hover:bg-[var(--icon-brand-bg-hover)]",
};

/** Solid icon well on stat cards — matches ERP KPI visibility. */
export const STAT_CARD_AVATAR: Record<IconTone, string> = {
  brand: "bg-brand-600 text-white dark:bg-brand-500",
  accent: "bg-accent text-white dark:bg-accent",
  success: "bg-accent text-white dark:bg-accent",
  warning: "bg-brand-600 text-white dark:bg-brand-500",
  error: "bg-brand-600 text-white dark:bg-brand-500",
};

/** Soft ring on stat card shells — indigo vs teal duotone. */
export const STAT_CARD_SURFACE: Record<IconTone, string> = {
  brand:
    "ring-1 ring-brand-200/80 dark:ring-brand-800/55",
  accent:
    "ring-1 ring-cyan-200/80 dark:ring-cyan-900/45",
  success:
    "ring-1 ring-cyan-200/80 dark:ring-cyan-900/45",
  warning:
    "ring-1 ring-brand-200/80 dark:ring-brand-800/55",
  error:
    "ring-1 ring-brand-200/80 dark:ring-brand-800/55",
};
