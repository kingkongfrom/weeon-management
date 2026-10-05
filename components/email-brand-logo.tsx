import type { HTMLAttributes } from "react";
import {
  EE_SMILE_PATH,
  EE_SMILE_STROKE_WIDTH,
  EE_SMILE_VIEWBOX,
  LOGO_EMAIL_GRADIENT_ID,
  LOGO_WORDMARK_GRADIENT,
} from "@/lib/brand/logo-wordmark";

/**
 * **Company** email lockup — "Weeon School", nothing else.
 *
 * Deliberately separate from `components/logo.tsx`. That component renders the
 * *console* identity, which carries a surface label ("Ops") and can be re-branded
 * per product. Transactional email goes to schools and families, so it must
 * always carry the **company** brand — deriving email art from a console
 * component is how the Ops label leaked into customer mail.
 *
 * Keep this component free of any surface/product label. If a new product needs
 * its own email chrome, add a sibling component rather than a prop here.
 *
 * Rendered to a PNG by `scripts/render-logo-wordmark.tsx` (Playwright + sharp)
 * and attached inline as a CID, so mail clients show it without a remote fetch.
 */
export function EmailBrandLogo({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex select-none items-baseline whitespace-nowrap text-2xl font-black tracking-tight ${className}`}
      {...props}
    >
      <span className="relative">
        <span
          style={{
            backgroundImage: `linear-gradient(90deg, ${LOGO_WORDMARK_GRADIENT.from} 0%, ${LOGO_WORDMARK_GRADIENT.to} 100%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Weeon
        </span>
        <svg
          className="pointer-events-none absolute -bottom-[0.14em] left-[27%] right-[35%] h-[0.24em]"
          viewBox={EE_SMILE_VIEWBOX}
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={LOGO_EMAIL_GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={LOGO_WORDMARK_GRADIENT.from} />
              <stop offset="1" stopColor={LOGO_WORDMARK_GRADIENT.to} />
            </linearGradient>
          </defs>
          <path
            d={EE_SMILE_PATH}
            fill="none"
            stroke={`url(#${LOGO_EMAIL_GRADIENT_ID})`}
            strokeWidth={EE_SMILE_STROKE_WIDTH}
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="ml-1.5 font-medium tracking-tight text-white">School</span>
    </span>
  );
}
