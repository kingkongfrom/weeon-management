"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Search,
  SearchX,
  Users,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TenantAvatar } from "@/components/dashboard/tenant-avatar";
import {
  resolveAcademicYearLabel,
  resolveBillingSeats,
  resolveSchoolCalendarStructure,
  type Tenant,
  type TenantRosterCounts,
} from "@/lib/domain";

type TenantRowData = Tenant & { logoUrl: string | null };

type TenantTableClientProps = {
  tenants: TenantRowData[];
  counts: Record<string, TenantRosterCounts>;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "demo", label: "Demo" },
  { id: "trial", label: "Trial" },
  { id: "past_due", label: "Past due" },
  { id: "suspended", label: "Suspended" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

/** Which statuses each filter bucket includes. */
const FILTER_MATCH: Record<Exclude<FilterId, "all">, string[]> = {
  active: ["active"],
  demo: ["demo", "demo_expired"],
  trial: ["trial", "trial_expired"],
  past_due: ["past_due"],
  suspended: ["suspended"],
};

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

function matchesFilter(tenant: Tenant, filter: FilterId): boolean {
  if (filter === "all") return true;
  return FILTER_MATCH[filter].includes(tenant.status);
}

/** Soft avatar tint keyed to lifecycle status, so rows read at a glance. */
const AVATAR_TONE: Record<string, string> = {
  active: "bg-success-subtle text-success",
  demo: "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300",
  trial: "bg-trial-subtle text-trial",
  past_due: "bg-warning-subtle text-warning",
  suspended: "bg-error-subtle text-error",
};

export function TenantTableClient({ tenants, counts }: TenantTableClientProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  const filterCounts = useMemo(() => {
    const map: Record<FilterId, number> = {
      all: tenants.length,
      active: 0,
      demo: 0,
      trial: 0,
      past_due: 0,
      suspended: 0,
    };
    for (const tenant of tenants) {
      for (const key of Object.keys(FILTER_MATCH) as Exclude<FilterId, "all">[]) {
        if (FILTER_MATCH[key].includes(tenant.status)) map[key] += 1;
      }
    }
    return map;
  }, [tenants]);

  const filtered = useMemo(
    () =>
      tenants.filter(
        (tenant) =>
          matchesQuery(tenant, query) && matchesFilter(tenant, filter),
      ),
    [tenants, query, filter],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="brand-page-title text-2xl text-foreground sm:text-3xl">
            Schools
          </h1>
          <p className="mt-1 text-sm font-medium text-foreground/55">
            Every institution on the platform — calendar, status, and roster.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-foreground/40"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, SABER, subdomain…"
            aria-label="Search schools"
            autoComplete="off"
            className="h-10 w-full rounded-lg border border-border bg-surface pr-9 pl-9 text-sm text-foreground outline-none transition-all placeholder:text-foreground/40 focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/15"
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

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.id;
          const count = filterCounts[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-border bg-surface text-foreground/60 hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {item.label}
              <span
                className={`tabular-nums ${
                  active ? "text-white/75" : "text-foreground/40"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-muted text-foreground/40">
            <SearchX size={22} />
          </span>
          <p className="text-sm font-semibold text-foreground">
            No schools match
          </p>
          <p className="max-w-xs text-xs font-medium text-foreground/50">
            Try a different search term or clear the status filter.
          </p>
          {query || filter !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="mt-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground/70 transition-colors hover:bg-surface-muted"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((tenant) => (
            <TenantRow
              key={tenant.id}
              tenant={tenant}
              roster={counts[tenant.id]}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TenantRow({
  tenant,
  roster,
}: {
  tenant: TenantRowData;
  roster?: TenantRosterCounts;
}) {
  const calendar = resolveSchoolCalendarStructure(tenant.settings);
  const academicYear = resolveAcademicYearLabel(tenant.settings);
  const seats = resolveBillingSeats(tenant);
  const students = roster?.students;
  const teachers = roster?.teachers;

  return (
    <li className="group relative">
      <Link
        href={`/dashboard/tenants/${tenant.id}`}
        className="card-lift flex items-center gap-4 rounded-2xl border border-border/80 bg-surface p-4 shadow-sm hover:border-brand-200 hover:bg-brand-50/30 sm:gap-5 sm:p-5 dark:hover:border-brand-900 dark:hover:bg-brand-950/20"
      >
        <TenantAvatar
          name={tenant.name}
          logoUrl={tenant.logoUrl}
          size="md"
          adjustPx={4}
          fallbackClassName={
            AVATAR_TONE[tenant.status] ?? "bg-surface-muted text-foreground/60"
          }
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-foreground sm:text-base">
              {tenant.name}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-foreground/50">
            {tenant.saber_code ? (
              <span className="tabular-nums">{tenant.saber_code}</span>
            ) : null}
            {tenant.saber_code && tenant.subdomain ? (
              <span className="text-foreground/20" aria-hidden>
                ·
              </span>
            ) : null}
            {tenant.subdomain ? <span>{tenant.subdomain}</span> : null}
          </div>
        </div>

        <div className="hidden min-w-0 flex-col items-end gap-0.5 md:flex md:w-40">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
            <CalendarDays size={13} className="text-foreground/40" aria-hidden />
            {calendar}
          </span>
          <span className="text-[11px] font-medium text-foreground/45">
            {academicYear}
          </span>
        </div>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <RosterStat label="Students" value={students} />
          <RosterStat label="Teachers" value={teachers} />
          <RosterStat label="Seats" value={seats} />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <StatusBadge status={tenant.status} suspendReason={tenant.suspend_reason} />
          <ChevronRight
            size={18}
            className="hidden text-foreground/25 transition-colors group-hover:text-brand-500 sm:block"
            aria-hidden
          />
        </div>
      </Link>
    </li>
  );
}

function RosterStat({
  label,
  value,
}: {
  label: string;
  value: number | undefined;
}) {
  if (value === undefined) {
    return (
      <span className="flex w-14 flex-col items-end">
        <span className="text-sm font-semibold tabular-nums text-foreground/35">
          —
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/40">
          {label}
        </span>
      </span>
    );
  }
  return (
    <span className="flex w-14 flex-col items-end">
      <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
        {label === "Students" ? (
          <Users size={12} className="text-foreground/30" aria-hidden />
        ) : null}
        {value}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/40">
        {label}
      </span>
    </span>
  );
}
