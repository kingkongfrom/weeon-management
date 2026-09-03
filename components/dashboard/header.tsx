"use client";

import { LogoCompact } from "@/components/logo";
import { AccountMenu } from "@/components/dashboard/account-menu";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { BackupAlert } from "@/lib/dashboard/backup-alerts";
import type { DashboardSessionUser } from "@/lib/dashboard/session-types";

export function Header({
  sessionUser,
  backupAlerts,
  onMenuToggle,
}: {
  sessionUser: DashboardSessionUser | null;
  backupAlerts: BackupAlert[];
  onMenuToggle: () => void;
}) {
  const initials = sessionUser?.initials ?? "OP";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-surface/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:gap-3 sm:px-6 lg:px-8 [height:calc(4rem+env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={onMenuToggle}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground/70 hover:bg-surface-muted lg:hidden"
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>

      <div className="min-w-0 flex-1 lg:hidden">
        <LogoCompact />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <NotificationBell alerts={backupAlerts} />
        <ThemeToggle compact />
        <AccountMenu
          className="ml-2 sm:ml-3"
          initials={initials}
          sessionUser={sessionUser}
        />
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12h18M3 6h18M3 18h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
