import "server-only";

import {
  BACKUP_STALE_HOURS,
  formatBackupAgeHours,
  hoursSinceTimestamp,
  isBackupStale,
  type BackupAlert,
  type TenantBackupStatus,
} from "@/lib/dashboard/backup-alerts";
import { createPlatformClient } from "@/lib/supabase/platform";

type BackupRow = {
  tenant_id: string;
  created_at: string;
  kind: string | null;
};

type TenantRow = {
  id: string;
  name: string;
};

function toBackupStatus(
  tenant: TenantRow,
  backup: BackupRow | undefined,
): TenantBackupStatus {
  const latestBackupAt = backup?.created_at ?? null;
  const hoursSinceBackup =
    latestBackupAt === null ? null : hoursSinceTimestamp(latestBackupAt);

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    latestBackupAt,
    hoursSinceBackup,
    backupKind: backup?.kind ?? null,
    isStale: isBackupStale(latestBackupAt),
  };
}

function latestBackupByTenant(rows: BackupRow[]): Map<string, BackupRow> {
  const map = new Map<string, BackupRow>();
  for (const row of rows) {
    if (!map.has(row.tenant_id)) map.set(row.tenant_id, row);
  }
  return map;
}

/** Latest backup snapshot for one tenant. */
export async function getTenantBackupStatus(
  tenantId: string,
  tenantName: string,
): Promise<TenantBackupStatus> {
  const client = createPlatformClient();
  const { data, error } = await client
    .from("tenant_backups")
    .select("tenant_id, created_at, kind")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Platform read of tenant backups failed: ${error.message}`);
  }

  return toBackupStatus(
    { id: tenantId, name: tenantName },
    data ?? undefined,
  );
}

/** Tenants whose latest backup is older than {@link BACKUP_STALE_HOURS} (or missing). */
export async function listStaleBackupAlerts(): Promise<BackupAlert[]> {
  const client = createPlatformClient();

  const [{ data: tenants, error: tenantError }, { data: backups, error: backupError }] =
    await Promise.all([
      client.from("tenants").select("id, name").order("name", { ascending: true }),
      client
        .from("tenant_backups")
        .select("tenant_id, created_at, kind")
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

  if (tenantError) {
    throw new Error(`Platform read of tenants failed: ${tenantError.message}`);
  }
  if (backupError) {
    throw new Error(`Platform read of tenant backups failed: ${backupError.message}`);
  }

  const latest = latestBackupByTenant(backups ?? []);

  return (tenants ?? [])
    .map((tenant) => toBackupStatus(tenant as TenantRow, latest.get(tenant.id)))
    .filter((status) => status.isStale)
    .sort((a, b) => {
      const aHours = a.hoursSinceBackup ?? Number.POSITIVE_INFINITY;
      const bHours = b.hoursSinceBackup ?? Number.POSITIVE_INFINITY;
      return bHours - aHours;
    });
}

export { formatBackupAgeHours, BACKUP_STALE_HOURS };
