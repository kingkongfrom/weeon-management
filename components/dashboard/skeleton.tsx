import type { ReactNode } from "react";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Pulse bar that stands in for text or a control until data arrives. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx("animate-pulse rounded-lg bg-surface-muted", className)}
      aria-hidden
    />
  );
}

function Screen({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function SecurityPageSkeleton() {
  return (
    <Screen
      label="Loading security"
      className="mx-auto flex w-full max-w-4xl flex-col gap-6"
    >
      <header className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="h-5 w-48 max-w-full" />
        </div>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-3">
          <Skeleton className="h-11 w-full sm:max-w-md" />
          <Skeleton className="h-11 w-36" />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        <AdministratorListSkeleton className="mt-5" />
      </section>
    </Screen>
  );
}

export function AdministratorListSkeleton({
  className,
  rows = 2,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <ul
      className={cx(
        "divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsPageSkeleton() {
  return (
    <Screen
      label="Loading analytics"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6"
    >
      <header>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
      </header>
      <div className="flex flex-col gap-6 lg:flex-row">
        <Skeleton className="h-[420px] flex-1 rounded-2xl" />
        <Skeleton className="h-[420px] w-full rounded-2xl lg:w-80" />
      </div>
    </Screen>
  );
}

/** @deprecated Use AnalyticsPageSkeleton */
export const OverviewPageSkeleton = AnalyticsPageSkeleton;

export function TenantsPageSkeleton() {
  return (
    <Screen
      label="Loading schools"
      className="mx-auto flex w-full max-w-6xl flex-col gap-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg sm:w-72" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-2xl border border-border/80 bg-surface p-4 sm:gap-5 sm:p-5"
          >
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-44 max-w-full" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
            <div className="hidden w-40 flex-col items-end gap-1.5 md:flex">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-8 w-14" />
            </div>
            <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </Screen>
  );
}

export function AccessControlPageSkeleton() {
  return (
    <Screen
      label="Loading access control"
      className="mx-auto flex w-full max-w-6xl flex-col gap-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg sm:w-72" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-28 rounded-full" />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface">
        {Array.from({ length: 6 }, (_, row) => (
          <div
            key={row}
            className="flex items-center gap-4 border-b border-border/60 px-4 py-3.5 last:border-b-0 sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="mt-1.5 h-3 w-52 max-w-full" />
            </div>
            <Skeleton className="hidden h-3.5 w-20 shrink-0 md:block" />
            <Skeleton className="hidden h-3.5 w-32 shrink-0 sm:block" />
            <Skeleton className="hidden h-6 w-28 shrink-0 rounded-full lg:block" />
          </div>
        ))}
      </div>
    </Screen>
  );
}

export function TenantDetailSkeleton() {
  return (
    <Screen
      label="Loading school"
      className="mx-auto flex w-full max-w-6xl flex-col"
    >
      <Skeleton className="mb-4 h-4 w-32" />

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface">
        <div className="h-1.5 w-full bg-surface-muted" />
        <div className="flex items-center gap-5 px-6 py-6">
          <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-8 w-64 max-w-full" />
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-4 w-56" />
          </div>
          <Skeleton className="hidden h-8 w-28 rounded-full sm:block" />
        </div>
      </div>

      <div className="mt-6">
        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
        <div className="mt-4 overflow-hidden rounded-2xl border border-border/80 bg-surface">
          <div className="flex items-center gap-3 px-5 py-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-1.5 h-3 w-56" />
            </div>
          </div>
          <div className="divide-y divide-border/70 border-t border-border/70">
            {Array.from({ length: 4 }, (_, row) => (
              <div
                key={row}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1.5 h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
