import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Hourglass, School, ShieldCheck, TriangleAlert } from "lucide-react";
import { OverviewPageSkeleton } from "@/components/dashboard/skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { listTenants } from "@/lib/platform/metrics";

export const metadata: Metadata = {
  title: "Overview",
};

async function OverviewContent() {
  const { tenants, reason } = await listTenants();

  const byStatus = tenants.reduce<Record<string, number>>((acc, t) => {
    const s = t.status;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const trials = byStatus["trial"] ?? 0;
  const active = byStatus["active"] ?? 0;
  const pastDue = byStatus["past_due"] ?? 0;
  const suspended = byStatus["suspended"] ?? 0;
  const needsAttention = pastDue + suspended;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Overview
        </h1>
        <p className="mt-1 text-sm font-medium text-foreground/55">
          Platform-wide tenant health — trials, active schools, and at-risk
          accounts.
        </p>
      </header>
      {tenants.length === 0 ? (
        <p className="text-sm font-medium text-warning">
          {reason ?? "No tenants found."}
        </p>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <StatCard
              label="Total tenants"
              value={tenants.length}
              icon={<School size={20} />}
              tone="brand"
            />
            <StatCard
              label="Active"
              value={active}
              icon={<ShieldCheck size={20} />}
              tone="success"
            />
            <StatCard
              label="Trial"
              value={trials}
              icon={<Hourglass size={20} />}
              tone="accent"
            />
            <StatCard
              label="Needs attention"
              value={needsAttention}
              hint={
                needsAttention > 0
                  ? [
                      pastDue > 0 ? `${pastDue} past due` : null,
                      suspended > 0 ? `${suspended} suspended` : null,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : undefined
              }
              icon={<TriangleAlert size={20} />}
              tone={needsAttention > 0 ? "error" : "success"}
            />
          </section>

          <p className="text-sm text-foreground/55">
            <Link
              href="/dashboard/tenants"
              className="font-medium text-brand-600 hover:underline dark:text-brand-300"
            >
              View all tenants
            </Link>
            {" · status and seats per school"}
          </p>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<OverviewPageSkeleton />}>
      <OverviewContent />
    </Suspense>
  );
}
