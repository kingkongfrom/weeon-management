import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { getPlatformSession } from "@/lib/auth/session";
import { listStaleBackupAlerts } from "@/lib/platform/backups";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [{ user, sessionUser }, backupAlerts] = await Promise.all([
    getPlatformSession(),
    listStaleBackupAlerts().catch(() => []),
  ]);
  if (!user) {
    redirect("/");
  }

  return (
    <DashboardShell sessionUser={sessionUser} backupAlerts={backupAlerts}>
      {children}
    </DashboardShell>
  );
}
