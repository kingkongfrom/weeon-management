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

export function SettingsPageSkeleton() {
  return (
    <Screen
      label="Loading settings"
      className="mx-auto flex w-full max-w-4xl flex-col gap-6"
    >
      <header className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </header>
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-6 w-6 rounded-lg" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="p-5 sm:p-6">
          <Skeleton className="h-14 w-full max-w-sm" />
        </div>
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

export function OverviewPageSkeleton() {
  return (
    <Screen
      label="Loading overview"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6"
    >
      <header>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </header>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
          >
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-7 w-12" />
            </div>
          </div>
        ))}
      </section>
      <Skeleton className="h-4 w-64 max-w-full" />
    </Screen>
  );
}

export function TenantsPageSkeleton() {
  return (
    <Screen
      label="Loading tenants"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6"
    >
      <header>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </header>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex gap-4 border-b border-border px-4 py-3 sm:gap-6">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="hidden h-3 w-28 min-[480px]:block" />
          <Skeleton className="ml-auto h-3 w-14" />
          <Skeleton className="ml-auto h-3 w-12" />
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0 sm:gap-6"
          >
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
            <div className="hidden min-w-0 flex-1 min-[480px]:block">
              <Skeleton className="h-4 w-24 max-w-full" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </Screen>
  );
}

export function TenantDetailSkeleton() {
  return (
    <Screen
      label="Loading tenant"
      className="mx-auto flex w-full max-w-6xl flex-col"
    >
      <Skeleton className="mb-4 h-4 w-32" />
      <Skeleton className="h-8 w-64 max-w-full" />
      <div className="mt-2 flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <div key={index} className="bg-surface p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-4 w-36 max-w-full" />
          </div>
        ))}
      </div>
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="mt-2 h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </Screen>
  );
}
