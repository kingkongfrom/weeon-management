import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ICON_TONE_CLASSES, type IconTone } from "@/lib/dashboard/icon-tone";
import { cn } from "@/lib/cn";

/**
 * Standard dashboard section: an icon chip, a title + optional description, and
 * an optional trailing action.
 */
export function SectionCard({
  title,
  description,
  icon,
  tone = "brand",
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  tone?: IconTone;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <SectionHeader
        title={title}
        description={description}
        icon={icon}
        tone={tone}
        action={action}
      />
      <div className="border-t border-border/70">{children}</div>
    </Card>
  );
}

/** Header row shared by cards and grouped panels. */
export function SectionHeader({
  title,
  description,
  icon,
  tone = "brand",
  action,
  bare = false,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  tone?: IconTone;
  action?: ReactNode;
  bare?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-5 sm:pt-5",
        bare && "px-0 pt-0 sm:px-0 sm:pt-0",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              ICON_TONE_CLASSES[tone],
            )}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs font-medium text-foreground/50">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Definition list used inside section cards. */
export function DetailList({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-border/60">{children}</dl>;
}

/**
 * A label/value row. `icon` renders a small leading glyph; `hint` shows below
 * the value.
 */
export function DetailRow({
  label,
  children,
  hint,
  icon,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-muted/40 sm:px-5">
      <dt className="flex shrink-0 items-center gap-2 text-sm font-medium text-foreground/50">
        {icon ? (
          <span className="text-foreground/35" aria-hidden>
            {icon}
          </span>
        ) : null}
        {label}
      </dt>
      <dd className="min-w-0 text-right">
        <div className="text-sm font-semibold text-foreground">{children}</div>
        {hint ? (
          <p className="mt-0.5 text-xs font-medium text-foreground/45">{hint}</p>
        ) : null}
      </dd>
    </div>
  );
}

/** A labelled group panel inside a facts layout. */
export function FactPanel({
  title,
  icon,
  tone = "brand",
  children,
  className,
}: {
  title: string;
  icon: ReactNode;
  tone?: IconTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-border/70 bg-surface-muted/40 px-4 py-3 sm:px-5">
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
            ICON_TONE_CLASSES[tone],
          )}
          aria-hidden
        >
          {icon}
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/55">
          {title}
        </h3>
      </div>
      <dl className="divide-y divide-border/60">{children}</dl>
    </section>
  );
}

/**
 * A single fact line inside a `FactPanel`. Left-aligned value, no hover chrome
 * — reads like a spec sheet rather than an interactive row.
 */
export function Fact({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 px-4 py-2.5 sm:px-5">
      <dt className="shrink-0 text-sm text-foreground/50">{label}</dt>
      <dd className="min-w-0 text-right">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        {hint ? (
          <span className="ml-2 text-xs font-medium text-foreground/40">
            {hint}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
