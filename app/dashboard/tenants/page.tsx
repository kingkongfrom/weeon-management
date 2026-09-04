import type { Metadata } from "next";
import { Suspense } from "react";
import { TenantsPageSkeleton } from "@/components/dashboard/skeleton";
import { TenantTableClient } from "@/components/dashboard/tenant-table-client";
import { listTenants } from "@/lib/platform/metrics";

export const metadata: Metadata = {
  title: "Tenants",
};

async function TenantsContent() {
  const { tenants, reason } = await listTenants();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      {tenants.length === 0 ? (
        <p className="text-sm font-medium text-warning">
          {reason ?? "No tenants found."}
        </p>
      ) : (
        <TenantTableClient tenants={tenants} />
      )}
    </div>
  );
}

export default function TenantsPage() {
  return (
    <Suspense fallback={<TenantsPageSkeleton />}>
      <TenantsContent />
    </Suspense>
  );
}
