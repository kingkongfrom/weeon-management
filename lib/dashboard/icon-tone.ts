export type IconTone = "brand" | "accent" | "success" | "warning";

/** Soft square + stroke icon. Use for tiles and stat cards — not for CTAs. */
export const ICON_TONE_CLASSES: Record<IconTone, string> = {
  brand:
    "bg-brand-50 text-brand-600 group-hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:group-hover:bg-brand-900/50",
  accent:
    "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:group-hover:bg-cyan-900/50",
  success:
    "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:group-hover:bg-emerald-900/50",
  warning:
    "bg-amber-50 text-amber-600 group-hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:group-hover:bg-amber-900/50",
};
