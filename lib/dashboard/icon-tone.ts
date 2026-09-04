export type IconTone =
  | "brand"
  | "accent"
  | "success"
  | "warning"
  | "error";

/**
 * Soft square + stroke icon. Use for tiles and stat cards — not for CTAs.
 *
 * Brand rule: exactly two hues — indigo (brand) and teal/cyan (accent) — as a
 * duotone (tinted tile + saturated glyph), matching the sibling repos. No
 * emerald/amber/red variety; each tone resolves to one of the two brand hues.
 */
export const ICON_TONE_CLASSES: Record<IconTone, string> = {
  brand:
    "bg-brand-50 text-brand-600 group-hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:group-hover:bg-brand-900/50",
  accent:
    "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:group-hover:bg-cyan-900/50",
  success:
    "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:group-hover:bg-cyan-900/50",
  warning:
    "bg-brand-50 text-brand-600 group-hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:group-hover:bg-brand-900/50",
  error:
    "bg-brand-50 text-brand-600 group-hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:group-hover:bg-brand-900/50",
};
