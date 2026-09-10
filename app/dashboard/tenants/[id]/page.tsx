import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  CreditCard,
  School,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { TenantDetailSkeleton } from "@/components/dashboard/skeleton";
import { RemoveAdministratorButton } from "@/components/dashboard/remove-administrator";
import { Card } from "@/components/ui/Card";
import { CopyableValue } from "@/components/ui/CopyableValue";
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
  trialDaysRemaining,
} from "@/lib/domain";
import {
  formatBackupAgeHours,
  getTenantBackupStatus,
} from "@/lib/platform/backups";
import {
  getTenantRosterCounts,
  listTenantAdmins,
} from "@/lib/platform/metrics";
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

  const [admins, backup, roster] = await Promise.all([
    listTenantAdmins(id),
    getTenantBackupStatus(id, tenant.name),
    getTenantRosterCounts(id),
  ]);

  const isTrial = tenant.status === "trial";
  const billingSeats = resolveBillingSeats(tenant);
  const trialDays = trialDaysRemaining(tenant.trial_ends_at);
  const trialUrgent = isTrial && trialDays !== null && trialDays <= 3;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link
        href="/dashboard/tenants"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground/55 transition-colors hover:text-brand-600 dark:hover:text-brand-300"
      >
        <ChevronLeft size={16} className="shrink-0" />
        Back to tenants
      </Link>

      <header className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-lg font-bold text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
          {initialsFor(tenant.name)}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {tenant.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={tenant.status} />
            {tenant.subdomain ? (
              <span className="text-sm font-medium text-foreground/55">
                {tenant.subdomain}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <HeaderStat label="Students" value={countValue(roster?.students)} />
            <span className="text-foreground/20">·</span>
            <HeaderStat label="Teachers" value={countValue(roster?.teachers)} />
            <span className="text-foreground/20">·</span>
            <BackupInline backup={backup} />
          </div>
        </div>
      </header>

      <AttentionBanner backup={backup} trialUrgent={trialUrgent} trialHint={formatTrialEndsHint(tenant.trial_ends_at)} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionCard title="Subscription & lifecycle" icon={<CreditCard size={16} />}>
            <DetailList>
              {isTrial ? (
                <DetailRow
                  label="Trial ends"
                  hint={formatTrialEndsHint(tenant.trial_ends_at)}
                >
                  {formatTenantDate(tenant.trial_ends_at)}
                </DetailRow>
              ) : null}
              <DetailRow label="Member since" hint={isTrial ? "Not counted during trial" : undefined}>
                {resolveMemberSince(tenant)}
              </DetailRow>
              {!isTrial ? (
                <DetailRow label="Paid until">
                  {formatTenantTimestamp(tenant.paid_until)}
                </DetailRow>
              ) : null}
              <DetailRow label="Billing seats" hint={billingSeats === 0 ? "Set on payment" : undefined}>
                {String(billingSeats)}
              </DetailRow>
              <DetailRow label="Plan">{tenant.plan ?? "—"}</DetailRow>
            </DetailList>
          </SectionCard>

          <SectionCard title="Academic setup" icon={<BookOpen size={16} />}>
            <DetailList>
              <DetailRow label="School calendar">
                {resolveSchoolCalendarStructure(tenant.settings)}
              </DetailRow>
              <DetailRow label="Academic year">
                {resolveAcademicYearLabel(tenant.settings)}
              </DetailRow>
              <DetailRow label="Primary school">
                {resolvePrimarySchoolCycles(tenant.settings)}
              </DetailRow>
              <DetailRow label="Secondary school">
                {resolveSecondarySchoolCycles(tenant.settings)}
              </DetailRow>
              <DetailRow label="Modules">
                {resolveTenantModules(tenant.settings)}
              </DetailRow>
            </DetailList>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard title="Identity" icon={<School size={16} />}>
            <DetailList>
              <DetailRow label="Código SABER">
                {tenant.saber_code ? (
                  <CopyableValue value={tenant.saber_code} label="Código SABER" />
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Tenant ID">
                <CopyableValue value={tenant.id} label="tenant ID" mono />
              </DetailRow>
              <DetailRow label="Created">
                {formatTenantDate(tenant.created_at)}
              </DetailRow>
            </DetailList>
          </SectionCard>

          <AdministratorsCard admins={admins} tenantId={tenant.id} />
        </div>
      </div>
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

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-foreground/50">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </span>
  );
}

function BackupInline({ backup }: { backup: TenantBackupStatus }) {
  const healthy = !backup.isStale && backup.latestBackupAt !== null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          healthy ? "bg-success" : "bg-error"
        }`}
      />
      <span className="text-foreground/50">Backup</span>
      <span
        className={`font-semibold tabular-nums ${
          healthy ? "text-foreground" : "text-error"
        }`}
      >
        {formatBackupAgeHours(backup.hoursSinceBackup)}
      </span>
    </span>
  );
}

function AttentionBanner({
  backup,
  trialUrgent,
  trialHint,
}: {
  backup: TenantBackupStatus;
  trialUrgent: boolean;
  trialHint?: string;
}) {
  const alerts: { tone: "warning" | "error"; icon: ReactNode; text: string }[] = [];
  if (backup.isStale) {
    alerts.push({
      tone: "error",
      icon: <ShieldAlert size={16} />,
      text: "No backup in the last 72 hours — investigate the scheduler.",
    });
  }
  if (trialUrgent) {
    alerts.push({
      tone: "warning",
      icon: <TriangleAlert size={16} />,
      text: `Trial ending soon${trialHint ? ` — ${trialHint.toLowerCase()}` : ""}.`,
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="mt-6 flex flex-col gap-2">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium ${
            alert.tone === "error"
              ? "border-error/25 bg-error-subtle text-error"
              : "border-warning/25 bg-warning-subtle text-warning"
          }`}
        >
          <span className="shrink-0">{alert.icon}</span>
          {alert.text}
        </div>
      ))}
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
        <span className="text-foreground/45" aria-hidden>
          {icon}
        </span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/60">
          {title}
        </h2>
      </div>
      {children}
    </Card>
  );
}

function DetailList({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-border/70">{children}</dl>;
}

function DetailRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
      <dt className="shrink-0 text-sm font-medium text-foreground/50">{label}</dt>
      <dd className="min-w-0 text-right">
        <div className="text-sm font-semibold text-foreground">{children}</div>
        {hint ? (
          <p className="mt-0.5 text-xs font-medium text-foreground/45">{hint}</p>
        ) : null}
      </dd>
    </div>
  );
}

function AdministratorsCard({
  admins,
  tenantId,
}: {
  admins: TenantAdminContact[];
  tenantId: string;
}) {
  const canRemove = admins.length > 1;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
        <span className="text-foreground/45" aria-hidden>
          <Users size={16} />
        </span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/60">
          Administrators
        </h2>
      </div>

      {admins.length === 0 ? (
        <p className="px-4 py-4 text-sm font-medium text-foreground/45 sm:px-5">
          No school administrators found.
        </p>
      ) : (
        <ul className="divide-y divide-border/70">
          {admins.map((admin, index) => (
            <li key={`${admin.email}-${index}`} className="px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {admin.name}
                  </p>
                  {admin.email ? (
                    <a
                      href={`mailto:${admin.email}`}
                      className="block truncate text-xs font-medium text-foreground/50 hover:text-brand-600 hover:underline dark:hover:text-brand-300"
                    >
                      {admin.email}
                    </a>
                  ) : (
                    <p className="truncate text-xs font-medium text-foreground/50">—</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
                    <ShieldCheck size={12} className="h-3 w-3" />
                    Admin
                  </span>
                  {canRemove ? (
                    <RemoveAdministratorButton
                      tenantId={tenantId}
                      profileId={admin.id}
                      name={admin.name}
                    />
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Roster counts are `undefined` when the platform metrics view is unavailable. */
function countValue(value: number | undefined): string {
  return value === undefined ? "—" : String(value);
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
