"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-border/80 bg-surface px-5 py-6 text-sm font-medium text-foreground/50">
          No administrator matches this search.
        </p>
      ) : (
        <AdminTable accounts={filtered} onSelect={setSelected} />
      )}

      {selected ? (
        <AdminDetailPopover
          account={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
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
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-surface-muted/50 text-[11px] font-bold uppercase tracking-wider text-foreground/50">
              <th scope="col" className="px-4 py-3 font-bold sm:px-5">
                Full name
              </th>
              <th scope="col" className="px-4 py-3 font-bold sm:px-5">
                Role
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
                  aria-label={`View ${account.name}`}
                  onClick={() => onSelect(account)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(account);
                    }
                  }}
                  className="cursor-pointer border-b border-border/60 transition-colors last:border-b-0 hover:bg-surface-muted/60 focus-visible:bg-surface-muted/60 focus-visible:outline-none"
                >
                  <td className="px-4 py-3 sm:px-5">
                    <span className="font-semibold text-foreground">
                      {account.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-foreground/45">
                      {account.email || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/70 capitalize sm:px-5">
                    {account.role}
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

/**
 * Anchored popover with the full administrator record. Rendered as a fixed,
 * viewport-centred panel so it is never clipped by the table's overflow; sized
 * for a phone width up to a comfortable dialog on desktop. Escape and an
 * outside click dismiss it.
 */
function AdminDetailPopover({
  account,
  onClose,
}: {
  account: AdminAccount;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !panelRef.current?.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/30"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${account.name} details`}
        className="dash-enter relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-start gap-4 border-b border-border px-5 py-4">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white dark:bg-brand-500"
            aria-hidden
          >
            {initialsFor(account.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-foreground">
              {account.name}
            </p>
            <p className="truncate text-sm font-medium text-foreground/55">
              {account.email || "—"}
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold capitalize text-foreground/45">
              {account.role}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/60 outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                account.active
                  ? "bg-success-subtle text-success"
                  : "bg-surface-muted text-foreground/60"
              }`}
            >
              {account.active ? "Active" : "Inactive"}
            </span>
            <span className="text-xs font-medium text-foreground/50">
              Administrator
            </span>
          </div>

          <Link
            href={`/dashboard/tenants/${account.tenantId}`}
            className="mt-4 flex items-center gap-3 rounded-xl bg-surface-muted px-4 py-3 transition-colors hover:bg-surface-muted/70"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/45">
                School
              </p>
              <p className="truncate text-sm font-semibold text-foreground">
                {account.tenantName}
              </p>
            </div>
            <StatusBadge status={account.tenantStatus} />
          </Link>

          <dl className="mt-4 divide-y divide-border/60">
            <PopoverRow label="Account status" value={account.accountStatus} />
            <PopoverRow
              label="Last sign-in"
              value={
                account.lastSignInAt
                  ? formatDateTime(account.lastSignInAt)
                  : <span className="text-foreground/45">Never signed in</span>
              }
            />
            <PopoverRow
              label="Last password reset"
              value={
                account.passwordResetAt ? (
                  formatDateTime(account.passwordResetAt)
                ) : (
                  <span className="text-foreground/45">No reset on record</span>
                )
              }
            />
            <PopoverRow label="Added" value={formatDateTime(account.createdAt)} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function PopoverRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <dt className="shrink-0 text-xs font-medium text-foreground/50">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
