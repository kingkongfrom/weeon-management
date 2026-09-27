import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Building2,
  Globe,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { SettingsPageSkeleton } from "@/components/dashboard/skeleton";
import { getPlatformSession } from "@/lib/auth/session";
import { opsAppOrigin } from "@/lib/auth/ops-origin";

export const metadata: Metadata = {
  title: "Settings",
};

function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm">
      <div className="flex items-start gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-icon-brand-bg text-icon-brand-fg"
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-0.5 text-sm font-medium text-foreground/55">
            {description}
          </p>
        </div>
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 px-5 py-3 sm:px-6">
      <span className="shrink-0 text-sm text-foreground/50">{label}</span>
      <span className="min-w-0 text-right text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

async function SettingsContent() {
  const { sessionUser } = await getPlatformSession();
  const origin = opsAppOrigin();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">
          Settings
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Account & console
        </h1>
        <p className="text-sm font-medium text-foreground/55">
          Your Weeon Ops session and workspace details. Appearance is in the
          account menu.
        </p>
      </header>

      <SettingsCard
        icon={<UserRound size={18} />}
        title="Your session"
        description="The Weeon Ops identity signed in on this device."
      >
        <InfoRow label="Name" value={sessionUser?.name ?? "—"} />
        <InfoRow label="Email" value={sessionUser?.email ?? "—"} />
        <InfoRow
          label="Role"
          value={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-0.5 text-xs font-semibold text-success">
              <ShieldCheck size={12} />
              {sessionUser?.role ?? "Ops staff"}
            </span>
          }
        />
      </SettingsCard>

      <SettingsCard
        icon={<Building2 size={18} />}
        title="Workspace"
        description="What this console can reach."
      >
        <InfoRow label="Scope" value="All tenants (platform)" />
        <InfoRow label="Data access" value="Service-role, server-only" />
        <InfoRow
          label="Console origin"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Globe size={13} className="text-foreground/40" aria-hidden />
              {origin}
            </span>
          }
        />
      </SettingsCard>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
