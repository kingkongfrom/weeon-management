"use client";

const SIZE_CLASS = {
  sm: "h-9 w-9 rounded-xl text-xs",
  md: "h-14 w-14 rounded-2xl text-lg",
  lg: "h-10 w-10 rounded-xl text-xs",
} as const;

/** Square, rounded-corner identity tile — the shared Weeon brand shape. */
export function UserAvatar({
  initials,
  src,
  size = "sm",
  className = "",
  title,
}: {
  initials: string;
  /** Uploaded avatar data URL; falls back to the gradient initials tile. */
  src?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  title?: string;
}) {
  if (src) {
    return (
      <span
        title={title}
        className={`inline-block shrink-0 overflow-hidden ${SIZE_CLASS[size]} ${className}`}
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
