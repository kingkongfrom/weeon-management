"use client";

import { useId, type HTMLAttributes } from "react";
import { LOGO_MARK_GRADIENT, LOGO_MARK_W_PATH } from "@/lib/brand/logo-mark";
import {
  EE_SMILE_PATH,
  EE_SMILE_STROKE_WIDTH,
  EE_SMILE_VIEWBOX,
  LOGO_WORDMARK_GRADIENT,
} from "@/lib/brand/logo-wordmark";

type LogoProps = HTMLAttributes<HTMLSpanElement> & {
  showTagline?: boolean;
};

/**
 * Brand device: a small gradient smile arc under the double-e of "Weeon".
 * The two e's read as eyes; the arc is the smile. Stretches to its box via
 * preserveAspectRatio="none" — size it with em so it scales with the type.
 *
 * The gradient id must be unique per instance: duplicate ids resolve to the
 * first match in the document, which may live in a display:none subtree
 * (e.g. the collapsed sidebar) — Chrome then refuses to paint the arc.
 */
function EeSmileArc({ className = "" }: { className?: string }) {
  const id = `weeon-ee-smile-${useId().replace(/:/g, "")}`;
  return (
    <svg
      className={`pointer-events-none absolute ${className}`}
      viewBox={EE_SMILE_VIEWBOX}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={LOGO_WORDMARK_GRADIENT.from} />
          <stop offset="1" stopColor={LOGO_WORDMARK_GRADIENT.to} />
        </linearGradient>
      </defs>
      <path
        d={EE_SMILE_PATH}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={EE_SMILE_STROKE_WIDTH}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Typography logo for Weeon Ops — gradient wordmark, smile under "ee". */
export function Logo({ showTagline = false, className = "", ...props }: LogoProps) {
  return (
    <span
      className={`inline-flex select-none flex-col items-start ${className}`}
      {...props}
    >
      <span className="relative inline-flex items-baseline whitespace-nowrap text-2xl font-black tracking-tight text-foreground sm:text-3xl">
        <span className="relative">
          <span className="brand-text">Weeon</span>
          <EeSmileArc className="left-[27%] right-[35%] -bottom-[0.14em] h-[0.24em]" />
        </span>
        <span className="ml-1.5 font-bold tracking-tight text-foreground">Ops</span>
      </span>
      {showTagline && (
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/50 sm:text-xs">
          Platform operations
        </span>
      )}
    </span>
  );
}

/** Compact logo variant for headers and navigation. */
export function LogoCompact({ className = "", ...props }: Omit<LogoProps, "showTagline">) {
  return (
    <span
      className={`inline-flex select-none items-baseline whitespace-nowrap text-xl font-black tracking-tight text-foreground ${className}`}
      {...props}
    >
      <span className="relative">
        <span className="brand-text">Weeon</span>
        <EeSmileArc className="left-[27%] right-[35%] -bottom-[0.12em] h-[0.22em]" />
      </span>
      <span className="ml-1 font-bold tracking-tight text-foreground">Ops</span>
    </span>
  );
}

/** Favicon-style mark: white "W" letter on the gradient tile (same path as weeon-admin). */
export function LogoMark({ className = "", ...props }: Omit<LogoProps, "showTagline">) {
  const gradientId = `weeon-logo-mark-${useId().replace(/:/g, "")}`;
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 ${className}`}
      {...props}
    >
      <svg
        viewBox="0 0 32 32"
        className="h-full w-full"
        role="img"
        aria-label="Weeon"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={LOGO_MARK_GRADIENT.from} />
            <stop offset="1" stopColor={LOGO_MARK_GRADIENT.to} />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
        <path fill="#fff" d={LOGO_MARK_W_PATH} />
      </svg>
    </span>
  );
}
