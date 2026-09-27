import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/80 bg-surface shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
