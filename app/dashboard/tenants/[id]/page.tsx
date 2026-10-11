import type { Metadata } from "next";
import { Suspense, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ShieldAlert, TriangleAlert } from "lucide-react";
import { TenantDetailSkeleton } from "@/components/dashboard/skeleton";
import { AdministratorsCard } from "@/components/dashboard/administrators-card";
import { TenantOverviewPanel } from "@/components/dashboard/tenant-overview-panel";
import { ModuleListCard } from "@/components/dashboard/module-list-card";
import { OpsAuditCard } from "@/components/dashboard/ops-audit-card";
import { SchoolActivityPanel } from "@/components/dashboard/school-activity-panel";
import { TenantAdminLoginCard } from "@/components/dashboard/tenant-admin-login-card";
import {
  parseTenantDetailSection,
  TenantDetailNav,
  type TenantDetailSection,
} from "@/components/dashboard/tenant-detail-nav";
import { TenantAvatar } from "@/components/dashboard/tenant-avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TenantBackupStatus } from "@/lib/dashboard/backup-alerts";
import {
  formatDemoEndsHint,
  formatTrialEndsHint,
  resolveTenantLogoUrl,
  trialDaysRemaining,
  type Tenant,
} from "@/lib/domain";
import {
  formatBackupAgeHours,
  getTenantBackupStatus,
} from "@/lib/platform/backups";
import {
  getTenantRosterCounts,
  listTenantAdmins,
} from "@/lib/platform/metrics";
import { listTenantModules } from "@/lib/platform/tenant-modules";
import { listTenantOpsAudit } from "@/lib/platform/ops-audit";
import { listSchoolActivity } from "@/lib/platform/school-activity";
import { listTenantAdminLoginSignals } from "@/lib/platform/tenant-admin-auth";
import { dashboardHubCardClass } from "@/lib/dashboard/hub-tones";
import { cn } from "@/lib/cn";
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
  return { title: tenant?.name ?? "School" };
}

async function SchoolDetailContent({
  params,
  section,
}: {
  params: Promise<{ id: string }>;
  section: TenantDetailSection;
}) {
  const { id } = await params;
  const tenant = await getTenant(id);

  if (!tenant) {
    notFound();
  }

  const [admins, backup, roster, modules, audit, schoolActivity, adminLogins] =
    await Promise.all([
      listTenantAdmins(id),
      getTenantBackupStatus(id, tenant.name),
      getTenantRosterCounts(id),
      listTenantModules(id),
      listTenantOpsAudit(id),
      listSchoolActivity(id, { limit: 500, range: "all" }),
      listTenantAdminLoginSignals(id),
    ]);

  const isTrial = tenant.status === "trial";
  const trialDays = trialDaysRemaining(tenant.trial_ends_at);
  const trialUrgent = isTrial && trialDays !== null && trialDays <= 3;
  const demoHint = formatDemoEndsHint(tenant.demo_ends_at);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link
        href="/dashboard/tenants"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground/55 transition-colors hover:text-brand-600 dark:hover:text-brand-300"
      >
        <ChevronLeft size={16} className="shrink-0" />
        Back to schools
      </Link>

      <HeroHeader
        tenant={tenant}
        backup={backup}
        students={countValue(roster?.students)}
        teachers={countValue(roster?.teachers)}
        admins={String(admins.length)}
      />

      <AttentionBanner
        backup={backup}
        trialUrgent={trialUrgent}
        trialHint={formatTrialEndsHint(tenant.trial_ends_at)}
      />

      <div className="dash-enter mt-6 flex flex-col gap-5" style={{ "--enter-delay": "80ms" } as CSSProperties}>
        <TenantDetailNav tenantId={tenant.id} active={section} />
        <div key={section} className="min-h-[16rem]">
          {section === "modules" ? (
            <ModuleListCard tenantId={tenant.id} modules={modules} />
          ) : null}
          {section === "people" ? (
            <AdministratorsCard admins={admins} tenantId={tenant.id} />
          ) : null}
          {section === "overview" ? (
            <TenantOverviewPanel tenant={tenant} demoHint={demoHint} />
          ) : null}
          {section === "activity" ? (
            <div className="flex flex-col gap-4">
              <TenantAdminLoginCard admins={adminLogins} />
              <SchoolActivityPanel entries={schoolActivity} />
              <OpsAuditCard entries={audit} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function SchoolDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  return (
    <Suspense fallback={<TenantDetailSkeleton />}>
      <SchoolDetailPageInner params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SchoolDetailPageInner({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionParam } = await searchParams;
  const section = parseTenantDetailSection(sectionParam);
  return <SchoolDetailContent params={params} section={section} />;
}

/** School identity, status, and quick facts — same mild card chrome as ERP / teacher web. */
function HeroHeader({
  tenant,
  backup,
  students,
  teachers,
  admins,
}: {
  tenant: Tenant;
  backup: TenantBackupStatus;
  students: string;
  teachers: string;
  admins: string;
}) {
  const healthy = !backup.isStale && backup.latestBackupAt !== null;
  const { name, status, subdomain, plan, suspend_reason } = tenant;
  return (
    <header className={cn(dashboardHubCardClass("blue"))}>
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
        <TenantAvatar
          name={name}
          logoUrl={resolveTenantLogoUrl(tenant)}
          size="lg"
          adjustPx={4}
          className="shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <h1 className="brand-page-title truncate text-2xl text-foreground sm:text-3xl">
            {name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={status} suspendReason={suspend_reason} />
            {subdomain ? (
              <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-foreground/60">
                {subdomain}
              </span>
            ) : null}
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-foreground/60">
              Plan {plan}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <HeroFact label="Students" value={students} />
            <span className="text-foreground/20" aria-hidden>
              ·
            </span>
            <HeroFact label="Teachers" value={teachers} />
            <span className="text-foreground/20" aria-hidden>
              ·
            </span>
            <HeroFact label="Admins" value={admins} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              healthy
                ? "bg-success-subtle text-success"
                : "bg-error-subtle text-error"
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                healthy ? "bg-success" : "bg-error"
              }`}
            />
            Backup {formatBackupAgeHours(backup.hoursSinceBackup)}
          </span>
        </div>
      </div>
    </header>
  );
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-foreground/50">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
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
    <div className="mt-4 flex flex-col gap-2">
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

function countValue(value: number | undefined): string {
  return value === undefined ? "—" : String(value);
}

