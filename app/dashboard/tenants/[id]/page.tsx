import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TenantAdminContact } from "@/lib/domain";
import type { TenantBackupStatus } from "@/lib/dashboard/backup-alerts";
import {
  formatTenantDate,
  formatTenantTimestamp,
  formatTrialEndsHint,
  resolveAcademicYearLabel,
  resolveBillingSeats,
  resolveMemberSince,
  resolvePrimarySchoolCycles,
  resolveSchoolCalendarStructure,
  resolveSecondarySchoolCycles,
  resolveTenantModules,
} from "@/lib/domain";
import {
  formatBackupAgeHours,
  getTenantBackupStatus,
} from "@/lib/platform/backups";
import { listTenantAdmins } from "@/lib/platform/metrics";
import { createPlatformClient } from "@/lib/supabase/platform";

async function getTenant(id: string) {
  const client = createPlatformClient();
  const { data, error } = await client
    .from("tenants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenant(id);
  return { title: tenant?.name ?? "Tenant" };
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenant(id);

  if (!tenant) {
    notFound();
  }

  const [admins, backup] = await Promise.all([
    listTenantAdmins(id),
    getTenantBackupStatus(id, tenant.name),
  ]);

  const isTrial = tenant.status === "trial";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link
        href="/dashboard/tenants"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground/55 transition-colors hover:text-brand-600 dark:hover:text-brand-300"
      >
        <ChevronLeftIcon />
        Back to tenants
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {tenant.name}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={tenant.status} />
          <span className="text-sm text-foreground/50">{tenant.id}</span>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        <StatusCell status={tenant.status} />
        <Cell k="School calendar" v={resolveSchoolCalendarStructure(tenant.settings)} />
        <Cell k="Primary school" v={resolvePrimarySchoolCycles(tenant.settings)} />
        <Cell
          k="Secondary school"
          v={resolveSecondarySchoolCycles(tenant.settings)}
        />
        <Cell k="Modules" v={resolveTenantModules(tenant.settings)} />
        <Cell k="Subdomain" v={tenant.subdomain ?? "—"} />
        <Cell k="Código SABER" v={tenant.saber_code ?? "—"} />
        {isTrial ? (
          <Cell
            k="Trial ends"
            v={formatTenantDate(tenant.trial_ends_at)}
            hint={formatTrialEndsHint(tenant.trial_ends_at)}
          />
        ) : (
          <Cell k="Academic year" v={resolveAcademicYearLabel(tenant.settings)} />
        )}
        {!isTrial ? (
          <Cell k="Billing seats" v={String(resolveBillingSeats(tenant))} />
        ) : null}
        <BackupStatusCell backup={backup} />
        {!isTrial ? (
          <>
            <Cell k="Member since" v={resolveMemberSince(tenant)} />
            <Cell k="Paid until" v={formatTenantTimestamp(tenant.paid_until)} />
          </>
        ) : null}
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/50">
          Administrators
        </h2>
        <AdministratorsList admins={admins} />
      </section>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AdministratorsList({ admins }: { admins: TenantAdminContact[] }) {
  if (admins.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground/55">
        No school administrators found.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground/50">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin, index) => (
            <tr
              key={`${admin.email}-${index}`}
              className="border-b border-border last:border-0"
            >
              <td className="px-4 py-3 font-medium text-foreground">{admin.name}</td>
              <td className="px-4 py-3 text-foreground/70">
                {admin.email ? (
                  <a
                    href={`mailto:${admin.email}`}
                    className="hover:text-brand-600 hover:underline dark:hover:text-brand-300"
                  >
                    {admin.email}
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusCell({ status }: { status: string }) {
  return (
    <div className="bg-surface p-4">
      <dt className="text-xs uppercase tracking-wide text-foreground/50">Status</dt>
      <dd className="mt-1">
        <StatusBadge status={status} />
      </dd>
    </div>
  );
}

function BackupStatusCell({ backup }: { backup: TenantBackupStatus }) {
  const age = formatBackupAgeHours(backup.hoursSinceBackup);
  const isHealthy = !backup.isStale && backup.latestBackupAt !== null;

  return (
    <div className="bg-surface p-4">
      <dt className="text-xs uppercase tracking-wide text-foreground/50">
        Latest backup
      </dt>
      <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
        {isHealthy ? (
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success"
            title="Last backup completed successfully"
          >
            <ShieldCheckIcon />
          </span>
        ) : null}
        <span className={backup.isStale ? "text-error" : "text-foreground"}>
          {age}
        </span>
      </dd>
      {(backup.isStale || backup.backupKind) ? (
        <p
          className={`mt-1 text-xs ${
            backup.isStale ? "text-error/80" : "text-foreground/45"
          }`}
        >
          {backup.isStale
            ? "No backup in 72h — investigate"
            : backup.backupKind}
        </p>
      ) : null}
    </div>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 20 7v6c0 4-2.5 7.5-8 9-5.5-1.5-8-5-8-9V7l8-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Cell({
  k,
  v,
  hint,
  valueClassName,
  hintClassName,
}: {
  k: string;
  v: string;
  hint?: string;
  valueClassName?: string;
  hintClassName?: string;
}) {
  return (
    <div className="bg-surface p-4">
      <dt className="text-xs uppercase tracking-wide text-foreground/50">{k}</dt>
      <dd className={`mt-1 text-sm font-medium text-foreground ${valueClassName ?? ""}`}>
        {v}
      </dd>
      {hint ? (
        <p className={`mt-1 text-xs ${hintClassName ?? "text-foreground/45"}`}>{hint}</p>
      ) : null}
    </div>
  );
}
