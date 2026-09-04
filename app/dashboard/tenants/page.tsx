import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { TenantsPageSkeleton } from "@/components/dashboard/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  resolveAcademicYearLabel,
  resolveBillingSeats,
  resolveSchoolCalendarStructure,
} from "@/lib/domain";
import { listTenants } from "@/lib/platform/metrics";

export const metadata: Metadata = {
  title: "Tenants",
};

async function TenantsContent() {
  const { tenants, reason } = await listTenants();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tenants
        </h1>
        <p className="mt-1 text-sm font-medium text-foreground/55">
          All schools and institutions on the platform — status and paid seats.
        </p>
      </header>
      {tenants.length === 0 ? (
        <p className="text-sm font-medium text-warning">
          {reason ?? "No tenants found."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[360px] text-left text-sm sm:min-w-[760px]">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  School calendar
                </th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                  Seats
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                  <tr
                  key={tenant.id}
                  className="group relative border-b border-border last:border-0 hover:bg-surface-muted/25 sm:cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/tenants/${tenant.id}`}
                      aria-label={`View ${tenant.name}`}
                      className="absolute inset-0 hidden sm:block"
                    />
                    <Link
                      href={`/dashboard/tenants/${tenant.id}`}
                      className="relative font-medium text-brand-600 hover:underline dark:text-brand-300"
                    >
                      {tenant.name}
                    </Link>
                    {tenant.subdomain ? (
                      <p className="relative mt-0.5 text-xs text-foreground/45">
                        {tenant.subdomain}
                      </p>
                    ) : null}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <p className="font-medium text-foreground">
                      {resolveSchoolCalendarStructure(tenant.settings)}
                    </p>
                    <p className="mt-0.5 hidden text-xs text-foreground/45 min-[480px]:block">
                      {resolveAcademicYearLabel(tenant.settings)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tenant.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-foreground/80 sm:table-cell">
                    {resolveBillingSeats(tenant)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TenantsPage() {
  return (
    <Suspense fallback={<TenantsPageSkeleton />}>
      <TenantsContent />
    </Suspense>
  );
}
