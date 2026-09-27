"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, X } from "lucide-react";
import type { AdminAccount } from "@/lib/platform/access-control";
import { StatusBadge } from "@/components/ui/StatusBadge";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending first login" },
  { id: "inactive", label: "Inactive" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function matchesQuery(account: AdminAccount, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    account.name,
    account.email,
    account.username ?? "",
    account.tenantName,
    account.id,
  ].some((value) => value.toLowerCase().includes(q));
}

function accountBucket(account: AdminAccount): Exclude<FilterId, "all"> {
  if (!account.active) return "inactive";
  if (account.accountStatus === "pending_first_login") return "pending";
  return "active";
}

function accountStateLabel(account: AdminAccount): { label: string; tone: string } {
  const bucket = accountBucket(account);
  if (bucket === "pending") {
    return { label: "Pending first login", tone: "bg-warning-subtle text-warning" };
  }
  if (bucket === "inactive") {
    return { label: "Inactive", tone: "bg-surface-muted text-foreground/60" };
  }
  return { label: "Active", tone: "bg-success-subtle text-success" };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AccessControlClient({
  accounts,
}: {
  accounts: AdminAccount[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  const filterCounts = useMemo(() => {
    const map: Record<FilterId, number> = {
      all: accounts.length,
      active: 0,
      pending: 0,
      inactive: 0,
    };
    for (const account of accounts) map[accountBucket(account)] += 1;
    return map;
  }, [accounts]);

  const filtered = useMemo(
    () =>
      accounts.filter(
        (account) =>
          matchesQuery(account, query) &&
          (filter === "all" || accountBucket(account) === filter),
      ),
    [accounts, query, filter],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="brand-page-title text-2xl text-foreground sm:text-3xl">
            Access control
          </h1>
          <p className="mt-1 text-sm font-medium text-foreground/55">
            Locate administrator accounts across every school and review their
            access state. Teachers, students, and guardians are managed by the
            school.
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
            placeholder="Search by name, email, or school…"
            aria-label="Search administrator accounts"
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
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  active ? "bg-white/20" : "bg-surface-muted text-foreground/50"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-border/80 bg-surface px-5 py-6 text-sm font-medium text-foreground/50">
          {accounts.length === 0
            ? "No administrator accounts found."
            : "No administrator matches this search."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((account) => {
            const state = accountStateLabel(account);
            return (
              <li key={account.id} className="group relative">
                <Link
                  href={`/dashboard/tenants/${account.tenantId}`}
                  className="card-lift flex items-center gap-4 rounded-2xl border border-border/80 bg-surface p-4 shadow-sm hover:border-brand-200 hover:bg-brand-50/30 sm:gap-5 sm:p-5 dark:hover:border-brand-900 dark:hover:bg-brand-950/20"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white dark:bg-brand-500"
                    aria-hidden
                  >
                    {initialsFor(account.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground sm:text-base">
                      {account.name}
                    </p>
                    <p className="truncate text-xs font-medium text-foreground/50">
                      {account.email || "—"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground/45">
                      <span className="truncate">{account.tenantName}</span>
                      <span aria-hidden>·</span>
                      <span>Added {formatDate(account.createdAt)}</span>
                      <span aria-hidden>·</span>
                      <span>
                        {account.firstLoginAt
                          ? `Last sign-in ${formatDate(account.firstLoginAt)}`
                          : "Never signed in"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={account.tenantStatus} />
                    <span
                      className={`hidden rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline-flex ${state.tone}`}
                    >
                      {state.label}
                    </span>
                    <ChevronRight
                      size={18}
                      className="hidden text-foreground/25 transition-colors group-hover:text-brand-500 sm:block"
                      aria-hidden
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
