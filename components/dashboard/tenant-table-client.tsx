"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  resolveAcademicYearLabel,
  resolveBillingSeats,
  resolveSchoolCalendarStructure,
  type Tenant,
} from "@/lib/domain";

function matchesQuery(tenant: Tenant, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    tenant.name,
    tenant.subdomain,
    tenant.slug ?? "",
    tenant.status,
    tenant.saber_code ?? "",
    tenant.id,
  ].some((value) => value.toLowerCase().includes(q));
}

export function TenantTableClient({ tenants }: { tenants: Tenant[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => tenants.filter((tenant) => matchesQuery(tenant, query)),
    [tenants, query],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tenants
          </h1>
          <p className="mt-1 text-sm font-medium text-foreground/55">
            All schools and institutions on the platform — status and paid seats.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-foreground/40"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tenants…"
            aria-label="Search tenants"
            autoComplete="off"
            className="h-10 w-full rounded-lg border border-border bg-surface pr-9 pl-9 text-sm text-foreground outline-none transition-all placeholder:text-foreground/40 focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/15 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm font-medium text-foreground/55">
          No tenants match your search.
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
              {filtered.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="group relative cursor-pointer border-b border-border last:border-0 hover:bg-surface-muted/25"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/tenants/${tenant.id}`}
                      aria-label={`View ${tenant.name}`}
                      className="absolute inset-0 block"
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
