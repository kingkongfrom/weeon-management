import { cn } from "@/lib/cn";

export function OpsUnreadCountBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[10px] font-bold leading-none text-white shadow-sm",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
