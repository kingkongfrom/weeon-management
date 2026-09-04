/** Shared Logo / LogoCompact wordmark tokens — used by `components/logo.tsx` and email rasterization. */
export const LOGO_WORDMARK_GRADIENT = {
  from: "#5e25cc",
  to: "#2b59ff",
} as const;

/** Light-surface foreground (`--foreground` in globals.css). */
export const LOGO_WORDMARK_FOREGROUND = "#1a2331";

export const LOGO_WORDMARK_GRADIENT_CSS = `linear-gradient(90deg, ${LOGO_WORDMARK_GRADIENT.from} 0%, ${LOGO_WORDMARK_GRADIENT.to} 100%)`;

export const EE_SMILE_VIEWBOX = "0 0 100 26";

/** Smile arc under the double-e of "Weeon". */
export const EE_SMILE_PATH = "M 8 4 Q 50 34 92 4";

export const EE_SMILE_STROKE_WIDTH = 9;

/** Default `Logo` smile placement (text-2xl / sm:text-3xl). */
export const LOGO_SMILE_LAYOUT = {
  left: "27%",
  right: "35%",
  bottomEm: -0.14,
  heightEm: 0.24,
} as const;

/** `LogoCompact` smile placement (text-xl). */
export const LOGO_COMPACT_SMILE_LAYOUT = {
  left: "27%",
  right: "35%",
  bottomEm: -0.12,
  heightEm: 0.22,
} as const;

export const LOGO_EMAIL_GRADIENT_ID = "weeon-wordmark";
