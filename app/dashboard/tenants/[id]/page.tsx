import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TenantDetailSkeleton } from "@/components/dashboard/skeleton";
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
import { ChevronLeft, ShieldCheck, Users } from "lucide-react";
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

async function TenantDetailContent({
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
        <ChevronLeft size={16} className="shrink-0" />
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
        <AdministratorsList admins={admins} />
      </section>
    </div>
  );
}

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<TenantDetailSkeleton />}>
      <TenantDetailContent params={params} />
    </Suspense>
  );
}

function AdministratorsList({ admins }: { admins: TenantAdminContact[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground/70">
            <Users size={16} className="h-4 w-4" />
            Administrators
          </h2>
          <p className="mt-1 text-sm font-medium text-foreground/55">
            School admins for this institution.
          </p>
        </div>

        {admins.length === 0 ? (
          <p className="text-sm font-medium text-foreground/45">
            No school administrators found.
          </p>
        ) : (
          <ul className="divide-y divide-border/70">
            {admins.map((admin, index) => (
              <li
                key={`${admin.email}-${index}`}
                className="flex flex-col gap-0.5 py-2.5 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {admin.name}
                  </p>
                  {admin.email ? (
                    <a
                      href={`mailto:${admin.email}`}
                      className="truncate text-xs font-medium text-foreground/50 hover:text-brand-600 hover:underline dark:hover:text-brand-300"
                    >
                      {admin.email}
                    </a>
                  ) : (
                    <p className="truncate text-xs font-medium text-foreground/50">
                      —
                    </p>
                  )}
                </div>
                <span className="mt-1 inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-emerald-700 sm:mt-0 dark:text-emerald-300">
                  <ShieldCheck size={12} className="h-3 w-3" />
                  Admin
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
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
            <ShieldCheck size={14} />
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
