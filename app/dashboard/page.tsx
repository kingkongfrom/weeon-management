import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
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
              icon={<SchoolIcon />}
              tone="brand"
            />
            <StatCard
              label="Active"
              value={active}
              icon={<ShieldCheckIcon />}
              tone="success"
            />
            <StatCard
              label="Trial"
              value={trials}
              icon={<TrialIcon />}
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
              icon={<AlertIcon />}
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

function SchoolIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 2.5 8h15L12 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M5 11v6M9.5 11v6M14.5 11v6M19 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M2.5 20.5h19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 4.5 5.6v5.6c0 4.6 3.2 7.9 7.5 9.4 4.3-1.5 7.5-4.8 7.5-9.4V5.6L12 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m9 11.5 2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrialIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 3h12M6 21h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 3c0 4 2 5 3.5 6.6C12 11.2 12 12.8 10.5 14.4 9 16 7 17 7 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 3c0 4-2 5-3.5 6.6C12 11.2 12 12.8 13.5 14.4 15 16 17 17 17 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10.3 3.7 2 17.5a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v4M12 17h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
