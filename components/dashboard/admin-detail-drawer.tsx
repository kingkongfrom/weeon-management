"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, School } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableValue } from "@/components/ui/CopyableValue";
import type { AdminAccount } from "@/lib/platform/access-control";

/**
 * Administrator detail drawer — portaled to `document.body` (same pattern as
 * the account drawer) so it is not trapped by any ancestor backdrop-blur.
 * Read-only for now; lifecycle actions land once the per-user access schema is
 * designed in `weeon-tenants` (see docs/access-control.md).
 */
export function AdminDetailDrawer({
  account,
  onClose,
}: {
  account: AdminAccount | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!account) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [account, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {account ? (
        <div key="admin-detail-drawer" className="fixed inset-0 z-[100]">
          <motion.button
            type="button"
            aria-label="Close details"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`${account.name} details`}
            className="absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col bg-surface shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold text-foreground">
                Administrator
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close details"
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex items-start gap-4">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white dark:bg-brand-500"
                  aria-hidden
                >
                  {initialsFor(account.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-foreground">
                    {account.name}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground/55">
                    {account.email || "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        account.active
                          ? "bg-success-subtle text-success"
                          : "bg-surface-muted text-foreground/60"
                      }`}
                    >
                      {account.active ? "Active" : "Inactive"}
                    </span>
                    <span className="inline-flex rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-foreground/60">
                      {account.role}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/dashboard/tenants/${account.tenantId}`}
                onClick={onClose}
                className="mt-5 flex items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3 transition-colors hover:bg-surface-muted/70"
              >
                <School size={16} className="shrink-0 text-foreground/50" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {account.tenantName}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-foreground/50">
                    Open school page
                  </p>
                </div>
                <StatusBadge status={account.tenantStatus} />
                <ExternalLink size={14} className="shrink-0 text-foreground/35" aria-hidden />
              </Link>

              <dl className="mt-6 divide-y divide-border/60">
                <DetailRow label="Account status" value={account.accountStatus} />
                <DetailRow
                  label="User ID"
                  value={<CopyableValue value={account.id} label="user ID" mono />}
                />
                <DetailRow label="Username" value={account.username ?? "—"} />
                <DetailRow label="Added" value={formatDateTime(account.createdAt)} />
                <DetailRow
                  label="Last sign-in"
                  value={
                    account.firstLoginAt
                      ? formatDateTime(account.firstLoginAt)
                      : "Never signed in"
                  }
                />
                <DetailRow
                  label="Welcome email"
                  value={
                    account.emailSentAt
                      ? formatDateTime(account.emailSentAt)
                      : "Not sent"
                  }
                />
                <DetailRow
                  label="Provisioned"
                  value={
                    account.provisionedAt
                      ? formatDateTime(account.provisionedAt)
                      : "—"
                  }
                />
              </dl>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <dt className="shrink-0 text-sm text-foreground/50">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
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

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
