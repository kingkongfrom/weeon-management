import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { AuthedAccountMenu, RequireOpsSession } from "@/components/dashboard/session-slots";
import { Skeleton } from "@/components/dashboard/skeleton";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale, getT } from "@/lib/i18n/server";
import { getRequestSidebarCollapsed } from "@/lib/dashboard/request-sidebar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.dashboardTitle };
}

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
  const [sidebarCollapsed, locale] = await Promise.all([
    getRequestSidebarCollapsed(),
    getLocale(),
  ]);

  return (
    <LocaleProvider locale={locale}>
      <DashboardShell
        initialSidebarCollapsed={sidebarCollapsed}
        accountSlot={
          <Suspense fallback={<AccountMenuSkeleton />}>
            <AuthedAccountMenu />
          </Suspense>
        }
      >
        <Suspense fallback={null}>
          <RequireOpsSession>{children}</RequireOpsSession>
        </Suspense>
      </DashboardShell>
    </LocaleProvider>
  );
}
