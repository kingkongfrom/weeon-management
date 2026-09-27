"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { AdminDetailDrawer } from "@/components/dashboard/admin-detail-drawer";
import type { AdminAccount } from "@/lib/platform/access-control";

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

/** Short profile id for the table (`profiles.id` is a uuid). */
function shortId(id: string): string {
  return id.slice(0, 8);
}

export function AccessControlClient({
  accounts,
}: {
  accounts: AdminAccount[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [selected, setSelected] = useState<AdminAccount | null>(null);

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

      <AdminTable accounts={filtered} onSelect={setSelected} />

      <AdminDetailDrawer account={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function AdminTable({
  accounts,
  onSelect,
}: {
  accounts: AdminAccount[];
  onSelect: (account: AdminAccount) => void;
}) {
  if (accounts.length === 0) {
    return (
      <p className="rounded-2xl border border-border/80 bg-surface px-5 py-6 text-sm font-medium text-foreground/50">
        No administrator matches this search.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-surface-muted/50 text-[11px] font-bold uppercase tracking-wider text-foreground/50">
              <th scope="col" className="px-4 py-3 font-bold sm:px-5">
                User ID
              </th>
              <th scope="col" className="px-4 py-3 font-bold sm:px-5">
                Full name
              </th>
              <th scope="col" className="px-4 py-3 font-bold sm:px-5">
                School
              </th>
              <th scope="col" className="px-4 py-3 font-bold sm:px-5">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => {
              const state = accountStateLabel(account);
              return (
                <tr
                  key={account.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${account.name}`}
                  onClick={() => onSelect(account)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(account);
                    }
                  }}
                  className="cursor-pointer border-b border-border/60 transition-colors last:border-b-0 hover:bg-surface-muted/60 focus-visible:bg-surface-muted/60 focus-visible:outline-none"
                >
                  <td className="px-4 py-3 font-mono text-xs text-foreground/55 sm:px-5">
                    {shortId(account.id)}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <span className="font-semibold text-foreground">
                      {account.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-foreground/45">
                      {account.email || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/70 sm:px-5">
                    {account.tenantName}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${state.tone}`}
                    >
                      {state.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
