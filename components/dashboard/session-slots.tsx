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
      showName
    />
  );
}

export async function BackupAlertsBell() {
  const alerts = await listStaleBackupAlerts().catch(() => []);
  return <NotificationBell alerts={alerts} />;
}
