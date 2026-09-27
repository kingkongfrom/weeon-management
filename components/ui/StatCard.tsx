import type { ReactNode } from "react";
import Link from "next/link";
import {
  STAT_CARD_AVATAR,
  STAT_CARD_SURFACE,
  type IconTone,
} from "@/lib/dashboard/icon-tone";

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
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${STAT_CARD_AVATAR[tone]}`}
          aria-hidden
        >
          {icon}
        </span>
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

  const base = `group card-lift flex items-center gap-4 rounded-2xl border border-border/80 bg-surface p-4 shadow-sm sm:p-5 ${STAT_CARD_SURFACE[tone]} hover:border-brand-200 hover:bg-brand-50/40 dark:hover:border-brand-900 dark:hover:bg-brand-950/20`;

  if (href) {
    return (
      <Link href={href} className={base}>
        {content}
      </Link>
    );
  }

  return <div className={base}>{content}</div>;
}
