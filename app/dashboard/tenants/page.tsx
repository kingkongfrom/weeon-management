import { Suspense } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listTenantsForDashboard } from "@/lib/platform/metrics";

async function TenantsBody() {
  const { tenants, reason } = await listTenantsForDashboard();

  if (tenants.length === 0) {
    return (
      <p className="text-sm text-warn">
        {reason ?? "No tenants found."}
      </p>
    );
  }

  return (
    <div className="card overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line-soft text-xs uppercase tracking-wide text-ink-2/50">
            <th className="px-4 py-3 font-medium">Tenant</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 text-right font-medium">Users</th>
            <th className="px-4 py-3 text-right font-medium">Seats</th>
            <th className="px-4 py-3 font-medium">Subdomain</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map(({ tenant, counts, seatUsage }) => {
            const util = seatUsage.utilizationPct;
            return (
              <tr
                key={tenant.id}
                className="border-b border-line-soft last:border-0 hover:bg-paper-2/40"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/tenants/${tenant.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {tenant.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tenant.status} />
                </td>
                <td className="px-4 py-3 capitalize">{tenant.plan}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {counts.profiles}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-2/70">
                  {seatUsage.billingSeats ?? "—"}
                  {typeof util === "number"
                    ? ` (${util}%)`
                    : null}
                </td>
                <td className="px-4 py-3 text-ink-2/60">
                  {tenant.subdomain}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TenantsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <p className="text-sm text-ink-2/60">
          Every school / institution, plus how many users each tenant has.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-ink-2/50">Loading…</p>}>
        <TenantsBody />
      </Suspense>
    </div>
  );
}
