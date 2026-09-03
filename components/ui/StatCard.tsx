import type { ReactNode } from "react";
import Link from "next/link";
import { ICON_TONE_CLASSES, type IconTone } from "@/lib/dashboard/icon-tone";

export function StatCard({
  label,
  value,
  change,
  hint,
  icon,
  tone = "brand",
  href,
}: {
  label: string;
  value: string | number;
  change?: string;
  hint?: string;
  icon?: ReactNode;
  tone?: IconTone;
  href?: string;
}) {
  const content = (
    <>
      {icon ? (
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ICON_TONE_CLASSES[tone]}`}
        >
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        {change ? (
          <p className="mt-0.5 text-xs font-medium text-foreground/60">{change}</p>
        ) : null}
        {hint ? (
          <p className="mt-0.5 text-xs font-medium text-foreground/50">{hint}</p>
        ) : null}
      </div>
    </>
  );

  const className =
    "group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors sm:p-5 hover:border-brand-200 hover:bg-brand-50/40 dark:hover:border-brand-900 dark:hover:bg-brand-950/20";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
