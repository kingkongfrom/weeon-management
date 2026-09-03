import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AccountMenu } from "@/components/dashboard/account-menu";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { getPlatformSession } from "@/lib/auth/session";
import { listStaleBackupAlerts } from "@/lib/platform/backups";

/** Blocks gated dashboard children until the caller is ops staff. */
export async function RequireOpsSession({ children }: { children: ReactNode }) {
  const { user } = await getPlatformSession();
  if (!user) redirect("/");
  return children;
}

export async function AuthedAccountMenu({ className }: { className?: string }) {
  const { sessionUser } = await getPlatformSession();
  return (
    <AccountMenu
      className={className}
      initials={sessionUser?.initials ?? "OP"}
      sessionUser={sessionUser}
    />
  );
}

export async function BackupAlertsBell() {
  const alerts = await listStaleBackupAlerts().catch(() => []);
  return <NotificationBell alerts={alerts} />;
}

export async function AuthedSidebarUser() {
  const { sessionUser } = await getPlatformSession();
  if (!sessionUser) return null;
  return (
    <div className="sidebar-user border-t border-border p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full brand-gradient text-xs font-bold text-white"
          title={[sessionUser.name, sessionUser.email].filter(Boolean).join(" · ")}
        >
          {sessionUser.initials}
        </div>
        <div className="sidebar-user-meta min-w-0">
          {sessionUser.name ? (
            <p className="truncate text-sm font-semibold text-foreground">
              {sessionUser.name}
            </p>
          ) : null}
          {sessionUser.email ? (
            <p className="truncate text-xs text-foreground/50">{sessionUser.email}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
