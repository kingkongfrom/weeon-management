import type { Metadata } from "next";
import { Suspense, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Boxes,
  ChevronLeft,
  CreditCard,
  Fingerprint,
  GraduationCap,
  History,
  ShieldAlert,
  TriangleAlert,
  Users,
} from "lucide-react";
import { TenantDetailSkeleton } from "@/components/dashboard/skeleton";
import { AdministratorsCard } from "@/components/dashboard/administrators-card";
import { DemoWindowCard } from "@/components/dashboard/demo-window-card";
import { SchoolStatusControl } from "@/components/dashboard/school-status-control";
import { ModuleListCard } from "@/components/dashboard/module-list-card";
import { OpsAuditCard } from "@/components/dashboard/ops-audit-card";
import {
  Fact,
  FactPanel,
  SectionCard,
} from "@/components/dashboard/section-card";
import { SegmentedWorkspace } from "@/components/dashboard/segmented-tabs";
import { TenantAvatar } from "@/components/dashboard/tenant-avatar";
import { CopyableValue } from "@/components/ui/CopyableValue";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TenantBackupStatus } from "@/lib/dashboard/backup-alerts";
import {
  formatTenantDate,
  formatTenantTimestamp,
  formatDemoEndsHint,
  formatTrialEndsHint,
  resolveAcademicYearLabel,
  resolveBillingSeats,
  resolveMemberSince,
  resolvePrimarySchoolCycles,
  resolveSchoolCalendarStructure,
  resolveSecondarySchoolCycles,
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenant(id);

  if (!tenant) {
    notFound();
  }

  const [admins, backup, roster, modules, audit] = await Promise.all([
    listTenantAdmins(id),
    getTenantBackupStatus(id, tenant.name),
    getTenantRosterCounts(id),
    listTenantModules(id),
    listTenantOpsAudit(id),
  ]);

  const isTrial = tenant.status === "trial";
  const isDemo =
    tenant.status === "demo" || tenant.status === "demo_expired";
  const billingSeats = resolveBillingSeats(tenant);
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

      <div className="dash-enter mt-6" style={{ "--enter-delay": "80ms" } as CSSProperties}>
        <SegmentedWorkspace
          initial="modules"
          tabs={[
            { id: "modules", label: "Modules", icon: <Boxes size={14} /> },
            { id: "people", label: "People", icon: <Users size={14} />, badge: admins.length },
            { id: "overview", label: "Overview", icon: <CreditCard size={14} /> },
            { id: "activity", label: "Activity", icon: <History size={14} />, badge: audit.length || undefined },
          ]}
          panels={{
            modules: <ModuleListCard tenantId={tenant.id} modules={modules} />,
            people: <AdministratorsCard admins={admins} tenantId={tenant.id} />,
            overview: (
              <div className="grid gap-4 lg:grid-cols-2">
                <FactPanel
                  title="Subscription & lifecycle"
                  icon={<CreditCard size={15} />}
                  tone="brand"
                >
                  {isDemo ? (
                    <Fact
                      label="Demo ends"
                      value={formatTenantDate(tenant.demo_ends_at)}
                      hint={demoHint}
                    />
                  ) : null}
                  {isTrial ? (
                    <Fact
                      label="Trial ends"
                      value={formatTenantDate(tenant.trial_ends_at)}
                      hint={formatTrialEndsHint(tenant.trial_ends_at)}
                    />
                  ) : null}
                  <Fact
                    label="Member since"
                    value={resolveMemberSince(tenant)}
                    hint={isTrial ? "Not counted during trial" : undefined}
                  />
                  {!isTrial ? (
                    <Fact
                      label="Paid until"
                      value={formatTenantTimestamp(tenant.paid_until)}
                    />
                  ) : null}
                  <Fact
                    label="Billing seats"
                    value={String(billingSeats)}
                    hint={billingSeats === 0 ? "Set on payment" : undefined}
                  />
                  <Fact label="Plan" value={tenant.plan ?? "—"} />
                </FactPanel>

                <FactPanel
                  title="Academic setup"
                  icon={<GraduationCap size={15} />}
                  tone="accent"
                >
                  <Fact
                    label="School calendar"
                    value={resolveSchoolCalendarStructure(tenant.settings)}
                  />
                  <Fact
                    label="Academic year"
                    value={resolveAcademicYearLabel(tenant.settings)}
                  />
                  <Fact
                    label="Primary school"
                    value={resolvePrimarySchoolCycles(tenant.settings)}
                  />
                  <Fact
                    label="Secondary school"
                    value={resolveSecondarySchoolCycles(tenant.settings)}
                  />
                </FactPanel>

                <FactPanel
                  title="Identity"
                  icon={<Fingerprint size={15} />}
                  tone="brand"
                  className="lg:col-span-2"
                >
                  <Fact
                    label="Código SABER"
                    value={
                      tenant.saber_code ? (
                        <CopyableValue value={tenant.saber_code} label="Código SABER" />
                      ) : (
                        "—"
                      )
                    }
                  />
                  <Fact
                    label="Tenant ID"
                    value={<CopyableValue value={tenant.id} label="tenant ID" mono />}
                  />
                  <Fact
                    label="Created"
                    value={formatTenantDate(tenant.created_at)}
                  />
                </FactPanel>

                <DemoWindowCard
                  tenantId={tenant.id}
                  status={tenant.status}
                  demoEndsAt={tenant.demo_ends_at}
                  demoHint={demoHint}
                />

                <SectionCard
                  title="Danger zone"
                  description="Irreversible or service-affecting actions for this school."
                  icon={<TriangleAlert size={16} />}
                  tone="error"
                  className="lg:col-span-2"
                >
                  <SchoolStatusControl
                    tenantId={tenant.id}
                    status={tenant.status}
                    suspendReason={tenant.suspend_reason ?? null}
                    readOnlyOn={formatReadOnlyOn(tenant.suspended_grace_ends_at)}
                  />
                </SectionCard>
              </div>
            ),
            activity: <OpsAuditCard entries={audit} />,
          }}
        />
      </div>
    </div>
  );
}

export default function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<TenantDetailSkeleton />}>
      <SchoolDetailContent params={params} />
    </Suspense>
  );
}

/**
 * Hero band: a soft gradient surface that carries the school identity, status
 * and quick facts — the visual anchor of the page, distinct from the cards
 * below it.
 */
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
    <header className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm">
      <div
        className="brand-gradient absolute inset-x-0 top-0 h-1.5"
        aria-hidden
      />
      <div className="flex flex-col gap-4 px-5 pt-6 pb-5 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
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

/** Date a delinquency hold turns read-only, for the suspend control copy. */
function formatReadOnlyOn(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
