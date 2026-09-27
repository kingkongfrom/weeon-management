import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessControlClient } from "@/components/dashboard/access-control-client";
import { AccessControlPageSkeleton } from "@/components/dashboard/skeleton";
import { listAdminAccounts } from "@/lib/platform/access-control";

export const metadata: Metadata = {
  title: "Access control",
};

async function AccessControlContent() {
  const { accounts, reason } = await listAdminAccounts();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      {reason && accounts.length === 0 ? (
        <p className="text-sm font-medium text-warning">{reason}</p>
      ) : (
        <AccessControlClient accounts={accounts} />
      )}
    </div>
  );
}

export default function AccessControlPage() {
  return (
    <Suspense fallback={<AccessControlPageSkeleton />}>
      <AccessControlContent />
    </Suspense>
  );
}
