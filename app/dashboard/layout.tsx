import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import {
  AuthedAccountMenu,
  AuthedSidebarUser,
  BackupAlertsBell,
  RequireOpsSession,
} from "@/components/dashboard/session-slots";
import { Skeleton } from "@/components/dashboard/skeleton";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { getRequestSidebarCollapsed } from "@/lib/dashboard/request-sidebar";
import { getRequestTheme } from "@/lib/theme/request-theme";

export const metadata: Metadata = {
  title: "Dashboard",
};

function AccountMenuSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, sidebarCollapsed] = await Promise.all([
    getRequestTheme(),
    getRequestSidebarCollapsed(),
  ]);

  return (
    <DashboardShell
      initialTheme={theme}
      initialSidebarCollapsed={sidebarCollapsed}
      accountSlot={
        <Suspense fallback={<AccountMenuSkeleton className="ml-2 sm:ml-3" />}>
          <AuthedAccountMenu className="ml-2 sm:ml-3" />
        </Suspense>
      }
      notificationSlot={
        <Suspense fallback={<NotificationBell alerts={[]} />}>
          <BackupAlertsBell />
        </Suspense>
      }
      sidebarFooter={
        <Suspense fallback={null}>
          <AuthedSidebarUser />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <RequireOpsSession>{children}</RequireOpsSession>
      </Suspense>
    </DashboardShell>
  );
}
