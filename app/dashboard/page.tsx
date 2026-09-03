import { Suspense } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { listTenantsForDashboard } from "@/lib/platform/metrics";

async function OverviewBody() {
  const { tenants, reason } = await listTenantsForDashboard();

  const byStatus = tenants.reduce<Record<string, number>>((acc, t) => {
    const s = t.tenant.status;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const totalProfiles = tenants.reduce((n, t) => n + t.counts.profiles, 0);
  const trials = byStatus["trial"] ?? 0;
  const pastDue = byStatus["past_due"] ?? 0;
  const suspended = byStatus["suspended"] ?? 0;

  // Scanned counts include the tenant row itself in `profiles`? No — profiles
  // only counts people; student/teacher/parent breakdown is a platform view.

  // Skeleton safe values when Supabase is not configured:
  if (tenants.length === 0) {
    return (
      <p className="text-sm text-warn">
        {reason ??
          "No tenants returned."}
      </p>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="Total tenants" value={tenants.length} tone="ink" />
      <StatCard label="Net users (profiles)" value={totalProfiles} tone="ink" />
      <StatCard label="Trial" value={trials} tone="trial" />
      <StatCard
        label="Needs attention"
        value={pastDue + suspended}
        tone={pastDue + suspended > 0 ? "danger" : "ok"}
        hint={suspended > 0 ? `${suspended} suspended` : undefined}
      />
    </section>
  );
}

export default function DashboardOverviewPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-ink-2/60">
            Cross-tenant status across the whole organization.
          </p>
        </div>
        <Link
          href="/dashboard/tenants"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:brightness-105"
        >
          View all tenants
        </Link>
      </div>

      <Suspense
        fallback={
          <p className="text-sm text-ink-2/50">
            Loading platform metrics…
          </p>
        }
      >
        <OverviewBody />
      </Suspense>
    </div>
  );
}
