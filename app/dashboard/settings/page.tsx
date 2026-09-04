import type { Metadata } from "next";
import { Suspense } from "react";
import { Info } from "lucide-react";
import { SettingsPageSkeleton } from "@/components/dashboard/skeleton";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getRequestTheme } from "@/lib/theme/request-theme";

export const metadata: Metadata = {
  title: "Settings",
};

function SettingsCard({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            {number}
          </span>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            {title}
          </h2>
        </div>
        <p className="text-sm font-medium text-foreground/55">{description}</p>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

async function SettingsContent() {
  const theme = await getRequestTheme();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">
          Settings
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Options
        </h1>
        <p className="text-sm font-medium text-foreground/55">
          Customize how this console looks and behaves. Changes apply to this
          device.
        </p>
      </header>

      <SettingsCard
        number="1"
        title="Appearance"
        description="Switch between a bright light theme and a low-light dark theme. Your choice is remembered on this device."
      >
        <div className="max-w-sm">
          <ThemeToggle initialTheme={theme} />
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-foreground/45">
          <Info size={14} />
          Your preference is saved automatically — no need to confirm.
        </p>
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
