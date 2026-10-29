"use client";

const SIZE_CLASS = {
  sm: "h-9 w-9 rounded-xl text-xs",
  md: "h-14 w-14 rounded-2xl text-lg",
  lg: "h-10 w-10 rounded-xl text-xs",
  drawer: "h-[84px] w-[84px] rounded-[1.35rem] text-2xl",
} as const;

/**
 * Same frame as the school ERP (`weeon-tenants/components/dashboard/user-avatar.tsx`):
 * a 2.5px ring in `foreground/30` plus a hairline outer shadow, so the photo
 * reads as a real portrait on both themes. `!` beats the unlayered
 * `border-color` reset in `globals.css`.
 */
const PHOTO_FRAME =
  "border-[2.5px] border-foreground/30! shadow-[0_0_0_1px_rgb(16_32_29/0.08),0_1px_3px_rgb(16_32_29/0.12)] dark:border-white/35! dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12),0_1px_4px_rgb(0_0_0/0.35)]";

/** Square, rounded-corner identity tile — the shared Weeon brand shape. */
export function UserAvatar({
  initials,
  src,
  size = "sm",
  className = "",
  title,
  frame,
}: {
  initials: string;
  /** Uploaded avatar data URL; falls back to the gradient initials tile. */
  src?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  title?: string;
  /** Force the photo frame on/off; defaults to `drawer` only. */
  frame?: boolean;
}) {
  const withFrame = frame ?? size === "drawer";
  const frameClass = withFrame && src ? PHOTO_FRAME : "";

  if (src) {
    return (
      <span
        title={title}
        className={`relative inline-block shrink-0 overflow-hidden bg-surface-muted ${SIZE_CLASS[size]} ${frameClass} ${className}`}
        aria-hidden={title ? undefined : true}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center justify-center font-bold text-white brand-gradient ${SIZE_CLASS[size]} ${className}`}
      aria-hidden={title ? undefined : true}
    >
      {initials}
    </span>
  );
}
