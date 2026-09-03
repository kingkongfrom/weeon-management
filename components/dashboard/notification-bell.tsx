"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BACKUP_STALE_HOURS,
  formatBackupAgeHours,
  type BackupAlert,
} from "@/lib/dashboard/backup-alerts";

export function NotificationBell({ alerts }: { alerts: BackupAlert[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const count = alerts.length;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-surface-muted hover:text-foreground ${
          count > 0 ? "text-error" : "text-foreground/80"
        }`}
        aria-label={
          count > 0
            ? `${count} backup alert${count === 1 ? "" : "s"}`
            : "Notifications"
        }
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <BellIcon />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-xs text-foreground/50">
              Backups older than {BACKUP_STALE_HOURS}h
            </p>
          </div>

          {count === 0 ? (
            <p className="px-3 py-4 text-sm text-foreground/55">
              All tenants have a recent backup.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {alerts.map((alert) => (
                <li key={alert.tenantId}>
                  <Link
                    href={`/dashboard/tenants/${alert.tenantId}`}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 transition-colors hover:bg-surface-muted"
                  >
                    <p className="text-sm font-medium text-error">
                      {alert.tenantName}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground/55">
                      Last backup: {formatBackupAgeHours(alert.hoursSinceBackup)}
                      {alert.backupKind ? ` · ${alert.backupKind}` : null}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.7 21a2 2 0 0 1-3.4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
