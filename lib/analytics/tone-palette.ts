/**
 * Soft-tone palette mirrored from weeon-teachers `lib/dashboard/tones.ts` so
 * Weeon Ops surfaces share the same card/ring/chip language as Teacher web.
 */

export type Tone = "blue" | "purple" | "yellow" | "green" | "rose";

/** White card body; the tone shows up as ring, title and icon chip. */
export const TONE_CARD: Record<Tone, string> = {
  blue: "bg-surface",
  purple: "bg-surface",
  yellow: "bg-surface",
  green: "bg-surface",
  rose: "bg-surface",
};

/** Thin colored ring around a card. */
export const TONE_RING: Record<Tone, string> = {
  blue: "shadow-sm ring-1 ring-[#9ec5eb]/70 dark:ring-[#2a5080]/80",
  purple: "shadow-sm ring-1 ring-[#c4b0ef]/70 dark:ring-[#5b4a9a]/80",
  yellow: "shadow-sm ring-1 ring-[#f5d88a]/70 dark:ring-[#8a6b2a]/80",
  green: "shadow-sm ring-1 ring-[#7dd3c7]/70 dark:ring-[#2a6b62]/80",
  rose: "shadow-sm ring-1 ring-[#f0b8c8]/70 dark:ring-[#8a3a52]/80",
};

/** Colored title / label text. */
export const TONE_LABEL: Record<Tone, string> = {
  blue: "text-[#124785] dark:text-[#bfdbfe]",
  purple: "text-[#4c1d95] dark:text-[#ddd6fe]",
  yellow: "text-[#92400e] dark:text-[#fde68a]",
  green: "text-[#0f4c47] dark:text-[#99f6e4]",
  rose: "text-[#9f1239] dark:text-[#fecdd3]",
};

/** Flat marketing-style icon chip (white glyph). */
export const TONE_AVATAR: Record<Tone, string> = {
  blue: "bg-[#2563b0]",
  purple: "bg-[#7c3aed]",
  yellow: "bg-[#d97706]",
  green: "bg-[#0f766e]",
  rose: "bg-[#e11d48]",
};

/** Soft row wash (~8% tone on the surface). */
export const TONE_WASH: Record<Tone, string> = {
  blue: "bg-[color-mix(in_srgb,#2563b0_8%,var(--surface))]",
  purple: "bg-[color-mix(in_srgb,#7c3aed_8%,var(--surface))]",
  yellow: "bg-[color-mix(in_srgb,#d97706_8%,var(--surface))]",
  green: "bg-[color-mix(in_srgb,#0f766e_8%,var(--surface))]",
  rose: "bg-[color-mix(in_srgb,#e11d48_8%,var(--surface))]",
};

/** Count / value pill inside a washed row. */
export const TONE_COUNT: Record<Tone, string> = {
  blue: "bg-[#d8e9fb] text-[#1e4d8c] dark:bg-[#16273f] dark:text-[#93c5fd]",
  purple: "bg-[#e6defb] text-[#5b21b6] dark:bg-[#241b45] dark:text-[#c4b5fd]",
  yellow: "bg-[#fdeecd] text-[#92400e] dark:bg-[#3a2a12] dark:text-[#fde68a]",
  green: "bg-[#c9f0ec] text-[#115e59] dark:bg-[#0f2f2c] dark:text-[#6ee7d7]",
  rose: "bg-[#fbdee7] text-[#9f1239] dark:bg-[#3a1622] dark:text-[#fda4af]",
};

/** Per-item tone rotation for lists. */
export const TONE_CYCLE: Tone[] = ["blue", "purple", "green", "yellow", "rose"];
