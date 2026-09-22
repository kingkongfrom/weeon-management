"use client";

const SIZE_CLASS = {
  sm: "h-9 w-9 rounded-xl text-xs",
  md: "h-14 w-14 rounded-2xl text-lg",
  lg: "h-10 w-10 rounded-xl text-xs",
} as const;

/** Square, rounded-corner initials avatar — the shared Weeon brand shape. */
export function UserAvatar({
  initials,
  size = "sm",
  className = "",
  title,
}: {
  initials: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  title?: string;
}) {
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
