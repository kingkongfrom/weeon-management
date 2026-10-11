import type { Metadata } from "next";
import { Suspense } from "react";
import { ObservabilityPanel } from "@/components/dashboard/observability-panel";
import { Skeleton } from "@/components/dashboard/skeleton";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadObservabilitySnapshot } from "@/lib/observability/sentry-platform";

export const metadata: Metadata = {
  title: "Observability",
};

function ObservabilitySkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6"
    >
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

async function ObservabilityContent() {
  const [snapshot, t, locale] = await Promise.all([
    loadObservabilitySnapshot(),
    getT(),
    getLocale(),
  ]);

  return <ObservabilityPanel snapshot={snapshot} t={t} locale={locale} />;
}

export default function ObservabilityPage() {
  return (
    <Suspense fallback={<ObservabilitySkeleton />}>
      <ObservabilityContent />
    </Suspense>
  );
}
