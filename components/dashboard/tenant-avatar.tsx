"use client";

import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

/** Diameter of the circular frame in px, per size preset. */
const SIZE_PX: Record<Size, number> = {
  sm: 40,
  md: 48,
  lg: 64,
};

/**
 * How much to enlarge the logo inside the circular frame. School logos are
 * round badges photographed/exported on a square white field, so the drawn
 * badge sits well inside the square. Over-scaling pushes that matte past the
 * clip, leaving the badge itself flush with the circular edge and cropping the
 * surrounding whitespace like a proper avatar.
 */
const LOGO_SCALE = 1.42;

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * School identity tile — the uploaded logo when the school has one, otherwise
 * the school initials on a status-tinted tile.
 *
 * Both paths render inside an exact-diameter `rounded-full` frame with
 * `overflow-hidden`, so the tile is always a perfect circle. The logo is drawn
 * with `object-cover` and a slight `LOGO_SCALE` magnification: the circular
 * clip crops the square source's corners and matte, and the markup stays
 * distortion-free on the mark itself. `logoUrl` must be resolved on the SERVER
 * (`SUPABASE_URL` is not exposed to the browser) and passed in.
 */
export function TenantAvatar({
  name,
  logoUrl,
  size = "md",
  /** Nudge the circle diameter in px (positive = bigger circle). */
  adjustPx = 0,
  fallbackClassName,
  className,
}: {
  name: string;
  /** Server-resolved public logo URL, or null when the school has no logo. */
  logoUrl: string | null;
  size?: Size;
  adjustPx?: number;
  /** Override the initials-tile tint (defaults to brand). */
  fallbackClassName?: string;
  className?: string;
}) {
  const diameter = SIZE_PX[size] + adjustPx;
  const sizeStyle = { width: diameter, height: diameter } as const;

  if (logoUrl) {
    return (
      <span
        style={sizeStyle}
        className={cn(
          "relative inline-block shrink-0 overflow-hidden rounded-full",
          "bg-surface-muted ring-1 ring-border/60 ring-inset",
          className,
        )}
      >
        {/* Plain <img>: the bucket host is external to Next's image optimizer.
            `object-cover` + the circular clip crop the square matte; the scale
            pushes the badge flush with the circle so no white ring shows. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: `scale(${LOGO_SCALE})` }}
        />
      </span>
    );
  }

  return (
    <span
      style={sizeStyle}
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full font-bold",
        SIZE_CLASSES[size],
        fallbackClassName ?? "bg-brand-600 text-white dark:bg-brand-500",
        className,
      )}
      aria-hidden
    >
      {initialsFor(name)}
    </span>
  );
}

