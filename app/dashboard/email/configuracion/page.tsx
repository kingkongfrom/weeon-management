import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OpsEmailSignatureCard } from "@/components/ops-email/ops-email-signature-card";
import { getPlatformSession } from "@/lib/auth/session";
import { loadOpsMailboxSettings, emptyOpsMailboxSettings } from "@/lib/platform/ops-mailbox-settings";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const OPS_EMAIL = "/dashboard/email";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.opsEmail.settingsPageTitle };
}

export default async function OpsEmailSettingsPage() {
  const [{ user }, t] = await Promise.all([getPlatformSession(), getT()]);
  const settings = user?.id
    ? await loadOpsMailboxSettings(user.id)
    : emptyOpsMailboxSettings();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href={OPS_EMAIL}
        className="-ml-2.5 inline-flex w-fit items-center gap-2 rounded-lg px-2.5 py-1.5 text-base font-semibold text-foreground/70 transition-all hover:bg-surface-muted hover:text-foreground"
      >
        <ArrowLeft className="h-5 w-5" />
        {t.opsEmail.back}
      </Link>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t.opsEmail.settingsSection}</h1>
        <p className="mt-1 text-sm font-medium text-foreground/55">{t.opsEmail.settingsPageDescription}</p>
      </header>
      <OpsEmailSignatureCard initialSettings={settings} />
    </div>
  );
}
