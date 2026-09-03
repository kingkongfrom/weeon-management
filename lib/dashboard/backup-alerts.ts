/** Hours without a backup before ops should investigate. */
export const BACKUP_STALE_HOURS = 72;

/** Client-safe backup alert row (loaded server-side, passed into the shell). */
export type BackupAlert = {
  tenantId: string;
  tenantName: string;
  hoursSinceBackup: number | null;
  latestBackupAt: string | null;
  backupKind: string | null;
};

export type TenantBackupStatus = BackupAlert & {
  isStale: boolean;
};

export function hoursSinceTimestamp(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

export function isBackupStale(
  latestBackupAt: string | null,
  staleHours = BACKUP_STALE_HOURS,
): boolean {
  if (!latestBackupAt) return true;
  return hoursSinceTimestamp(latestBackupAt) >= staleHours;
}

/** Human-readable backup age in hours for ops display. */
export function formatBackupAgeHours(hoursSinceBackup: number | null): string {
  if (hoursSinceBackup === null) return "Never";
  if (hoursSinceBackup < 1) return "<1h ago";
  return `${Math.floor(hoursSinceBackup)}h ago`;
}
