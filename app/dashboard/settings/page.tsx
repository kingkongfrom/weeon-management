import type {Metadata} from "next";
import {Suspense} from "react";
import {InviteAdministrator} from "@/components/dashboard/invite-administrator";
import {ThemeToggle} from "@/components/theme/theme-toggle";
import {getPlatformSession} from "@/lib/auth/session";
import {isPlatformStaffInviter} from "@/lib/auth/policy";
import {
    listPlatformStaff,
    type PlatformStaffMember,
} from "@/lib/auth/platform-staff";

export const metadata: Metadata = {
    title: "Settings",
};

function AdministratorRow({member}: { member: PlatformStaffMember }) {
    return (
        <li className="flex items-center gap-3 px-4 py-3">
      <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full brand-gradient text-xs font-bold text-white"
          aria-hidden
      >
        {member.initials}
      </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {member.name ?? member.email}
          </span>
                    {member.isPrimary ? (
                        <span
                            className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              Owner
            </span>
                    ) : null}
                    {member.role ? (
                        <span className="shrink-0 truncate text-xs font-medium text-brand-600 dark:text-brand-300">
              {member.role}
            </span>
                    ) : null}
                    {member.pending ? (
                        <span
                            className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warning">
              Invite pending
            </span>
                    ) : null}
                </div>
                <p className="truncate text-sm text-foreground/55">{member.email}</p>
            </div>
        </li>
    );
}

function AdministratorSkeleton() {
    return (
        <ul className="animate-pulse divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {[0, 1].map((row) => (
                <li
                    key={row}
                    className="flex items-center gap-3 px-4 py-3"
                    aria-hidden
                >
                    <span className="h-9 w-9 shrink-0 rounded-full bg-surface-muted"/>
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-3.5 w-2/5 rounded bg-surface-muted"/>
                        <div className="h-3 w-3/5 rounded bg-surface-muted/80"/>
                    </div>
                </li>
            ))}
        </ul>
    );
}

async function AdministratorsList() {
    const administrators: PlatformStaffMember[] =
        (await listPlatformStaff().catch(() => [])) ?? [];

    if (administrators.length === 0) {
        return (
            <p className="rounded-xl border border-border bg-surface px-4 py-5 text-sm font-medium text-foreground/50">
                No administrators configured yet.
            </p>
        );
    }

    return (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {administrators.map((member) => (
                <AdministratorRow key={member.email} member={member}/>
            ))}
        </ul>
    );
}

export default async function SettingsPage() {
    const {sessionUser} = await getPlatformSession();
    const actorEmail = sessionUser?.email ?? "";
    const canInvite = isPlatformStaffInviter(actorEmail);

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Settings
                </h1>
                <p className="mt-1 text-sm font-medium text-foreground/55">
                    Appearance and who can sign in to this console.
                </p>
            </header>

            <InviteAdministrator canInvite={canInvite}/>

            <section className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-lg font-bold text-foreground">Administrators</h2>
                <p className="mt-1 text-sm font-medium text-foreground/55">
                    People who can sign in here. School admins on a tenant are listed on that school&apos;s page.
                </p>
                <Suspense fallback={<AdministratorSkeleton/>}>
                    <div className="mt-5">
                        <AdministratorsList/>
                    </div>
                </Suspense>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-col gap-5">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Appearance</h2>
                        <p className="mt-1 text-sm font-medium text-foreground/55">
                            Switch between light and dark mode. Your choice is saved on this device.
                        </p>
                    </div>
                    <div className="max-w-sm">
                        <ThemeToggle/>
                    </div>
                </div>
            </section>
        </div>
    );
}
