export type ControlSize = "sm" | "md";

export function controlShellClass(size: ControlSize) {
  return size === "md" ? "h-11 rounded-xl px-3.5 text-sm" : "h-8 rounded-lg px-2.5 text-sm";
}

export function controlInputClass({
  size = "sm",
  error,
  className,
}: {
  size?: ControlSize;
  error?: boolean;
  className?: string;
}) {
  return [
    "w-full border bg-surface text-foreground outline-none transition-[border-color,box-shadow,background-color]",
    "placeholder:text-foreground/40",
    "hover:border-border-strong",
    "focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/15",
    controlShellClass(size),
    error
      ? "border-error bg-error-subtle/30 focus:border-error focus:ring-error/20"
      : "border-border shadow-sm shadow-black/[0.03] dark:shadow-black/20",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function controlLabelClass(size: ControlSize) {
  return size === "md"
    ? "text-sm font-semibold leading-snug text-foreground/90"
    : "text-xs font-semibold leading-none text-foreground/90";
}

export function controlFieldGap(size: ControlSize) {
  return size === "md" ? "gap-2" : "gap-1.5";
}
