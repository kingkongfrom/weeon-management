import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import {
  AuthedAccountMenu,
  AuthedSidebarUser,
  RequireOpsSession,
} from "@/components/dashboard/session-slots";
import { Skeleton } from "@/components/dashboard/skeleton";
import { getRequestSidebarCollapsed } from "@/lib/dashboard/request-sidebar";

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
  const sidebarCollapsed = await getRequestSidebarCollapsed();

  return (
    <DashboardShell
      initialSidebarCollapsed={sidebarCollapsed}
      accountSlot={
        <Suspense fallback={<AccountMenuSkeleton />}>
          <AuthedAccountMenu />
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
