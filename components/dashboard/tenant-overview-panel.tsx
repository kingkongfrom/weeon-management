import Link from "next/link";
import {
  CreditCard,
  ExternalLink,
  Fingerprint,
  GraduationCap,
  TriangleAlert,
} from "lucide-react";
import { DemoWindowCard } from "@/components/dashboard/demo-window-card";
import { SchoolStatusControl } from "@/components/dashboard/school-status-control";
import { Fact, FactPanel } from "@/components/dashboard/section-card";
import { CopyableValue } from "@/components/ui/CopyableValue";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatOpsDateTime,
  formatOpsDateTimeNullable,
  OPS_TIMEZONE_LABEL,
} from "@/lib/datetime/costa-rica";
import {
  formatTenantDate,
  formatTrialEndsHint,
  resolveAcademicYearLabel,
  resolveBillingSeats,
  resolveMemberSince,
  resolvePrimarySchoolCycles,
  resolveSchoolCalendarStructure,
  resolveSecondarySchoolCycles,
  type Tenant,
} from "@/lib/domain";

function resolveAppOrigin(): string {
  return (process.env.WEEON_APP_ORIGIN ?? "https://app.weeon.school").replace(/\/$/, "");
}

function formatPlanLabel(plan: string | null | undefined): string {
  if (!plan?.trim()) return "—";
  const normalized = plan.trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatPaidUntil(iso: string | null | undefined): string {
  if (!iso) return "—";
  return formatTenantDate(iso);
}

function formatReadOnlyOn(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return formatTenantDate(iso);
}

export function TenantOverviewPanel({
  tenant,
  demoHint,
}: {
  tenant: Tenant;
  demoHint?: string;
}) {
  const isTrial = tenant.status === "trial";
  const isDemo = tenant.status === "demo" || tenant.status === "demo_expired";
  const billingSeats = resolveBillingSeats(tenant);
  const appOrigin = resolveAppOrigin();
  const memberSinceRaw = resolveMemberSince(tenant);
  const memberSince =
    memberSinceRaw === "—"
      ? memberSinceRaw
      : tenant.paid_at
        ? formatOpsDateTime(tenant.paid_at)
        : memberSinceRaw;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-medium text-foreground/45">{OPS_TIMEZONE_LABEL}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <FactPanel title="Commercial" icon={<CreditCard size={15} />} tone="brand">
          <Fact
            label="Status"
            value={
              <StatusBadge status={tenant.status} suspendReason={tenant.suspend_reason} />
            }
          />
          {isDemo ? (
            <Fact
              label="Demo ends"
              value={formatOpsDateTimeNullable(tenant.demo_ends_at)}
              hint={demoHint}
            />
          ) : null}
          {isTrial ? (
            <Fact
              label="Trial ends"
              value={formatOpsDateTimeNullable(tenant.trial_ends_at)}
              hint={formatTrialEndsHint(tenant.trial_ends_at)}
            />
          ) : null}
          <Fact
            label="Member since"
            value={memberSince}
            hint={isTrial ? "Not counted during trial" : undefined}
          />
          {!isTrial ? (
            <Fact label="Paid until" value={formatPaidUntil(tenant.paid_until)} />
          ) : null}
          <Fact
            label="Billing seats"
            value={String(billingSeats)}
            hint={billingSeats === 0 ? "Set on payment" : undefined}
          />
          <Fact label="Plan" value={formatPlanLabel(tenant.plan)} />
          <Fact
            label="School ERP"
            value={
              <Link
                href={appOrigin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300"
              >
                Open portal
                <ExternalLink size={13} aria-hidden />
              </Link>
            }
          />
        </FactPanel>

        <FactPanel title="Academic setup" icon={<GraduationCap size={15} />} tone="accent">
          <Fact
            label="School calendar"
            value={resolveSchoolCalendarStructure(tenant.settings)}
          />
          <Fact label="Academic year" value={resolveAcademicYearLabel(tenant.settings)} />
          <Fact label="Primary school" value={resolvePrimarySchoolCycles(tenant.settings)} />
          <Fact
            label="Secondary school"
            value={resolveSecondarySchoolCycles(tenant.settings)}
          />
        </FactPanel>
      </div>

      <FactPanel
        title="Reference IDs"
        icon={<Fingerprint size={15} />}
        tone="brand"
        className="lg:col-span-2"
      >
        <div className="grid gap-0 sm:grid-cols-3 sm:divide-x sm:divide-border/60">
          <div className="space-y-1.5 px-4 py-4 sm:px-5">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground/45">
              Código SABER
            </p>
            {tenant.saber_code ? (
              <CopyableValue value={tenant.saber_code} label="Código SABER" />
            ) : (
              <p className="text-sm font-semibold text-foreground">—</p>
            )}
          </div>
          <div className="space-y-1.5 border-t border-border/60 px-4 py-4 sm:border-t-0 sm:px-5">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground/45">
              Tenant ID
            </p>
            <CopyableValue value={tenant.id} label="tenant ID" mono />
          </div>
          <div className="space-y-1.5 border-t border-border/60 px-4 py-4 sm:border-t-0 sm:px-5">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground/45">
              Created
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatTenantDate(tenant.created_at)}
            </p>
            {tenant.subdomain ? (
              <p className="text-xs font-medium text-foreground/45">
                Subdomain · {tenant.subdomain}
              </p>
            ) : null}
          </div>
        </div>
      </FactPanel>

      <DemoWindowCard
        tenantId={tenant.id}
        status={tenant.status}
        demoEndsAt={tenant.demo_ends_at}
        demoHint={demoHint}
      />

      <FactPanel
        title="Danger zone"
        icon={<TriangleAlert size={15} />}
        tone="error"
        className="lg:col-span-2"
      >
        <p className="border-b border-border/60 px-4 py-3 text-xs font-medium text-foreground/50 sm:px-5">
          Irreversible or service-affecting actions for this school.
        </p>
        <div className="px-4 py-1 sm:px-5">
          <SchoolStatusControl
            tenantId={tenant.id}
            status={tenant.status}
            suspendReason={tenant.suspend_reason ?? null}
            readOnlyOn={formatReadOnlyOn(tenant.suspended_grace_ends_at)}
          />
        </div>
      </FactPanel>
    </div>
  );
}
