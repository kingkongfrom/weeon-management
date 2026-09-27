import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AccountMenu } from "@/components/dashboard/account-menu";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { getPlatformSession } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/session";
import { listTotpFactors } from "@/lib/auth/mfa";
import { getMfaAssurance } from "@/lib/auth/mfa";
import { listStaleBackupAlerts } from "@/lib/platform/backups";

/** Blocks gated dashboard children until the caller is ops staff. */
export async function RequireOpsSession({ children }: { children: ReactNode }) {
  const { user } = await getPlatformSession();
  if (!user) redirect("/");
  return children;
}

export async function AuthedAccountMenu({ className }: { className?: string }) {
  const { user, sessionUser } = await getPlatformSession();

  // Read MFA status server-side so the drawer renders it without a client fetch.
  let mfaEnrolled = false;
  let mfaFactorId: string | null = null;
  if (user) {
    try {
      const supabase = await createSessionClient();
      const [status, assurance] = await Promise.all([
        listTotpFactors(supabase),
        getMfaAssurance(supabase),
      ]);
      // Only treat it as "on" once this session has actually passed the factor.
      mfaEnrolled = status.enrolled && assurance.currentLevel === "aal2";
      mfaFactorId = status.factors.find((f) => f.status === "verified")?.id ?? null;
    } catch {
      // Never block the header on an MFA read failure.
    }
  }

  return (
    <AccountMenu
      className={className}
      initials={sessionUser?.initials ?? "OP"}
      sessionUser={sessionUser}
      showName
      mfaEnrolled={mfaEnrolled}
      mfaFactorId={mfaFactorId}
    />
  );
}

export async function BackupAlertsBell() {
  const alerts = await listStaleBackupAlerts().catch(() => []);
  return <NotificationBell alerts={alerts} />;
}
