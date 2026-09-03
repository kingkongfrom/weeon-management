import type { Metadata } from "next";
import { Suspense } from "react";
import { InviteAdministrator } from "@/components/dashboard/invite-administrator";
import { SecurityPageSkeleton } from "@/components/dashboard/skeleton";
import { getPlatformSession } from "@/lib/auth/session";
import { isPlatformStaffInviter } from "@/lib/auth/policy";
import {
  listPlatformStaff,
  type PlatformStaffMember,
} from "@/lib/auth/platform-staff";

export const metadata: Metadata = {
  title: "Security",
};

function AdministratorRow({ member }: { member: PlatformStaffMember }) {
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
          {member.role ? (
            <span className="ml-1 shrink-0 truncate text-xs font-medium text-brand-600 dark:text-brand-300">
              {member.role}
            </span>
          ) : null}
          {member.pending ? (
            <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warning">
              Invite pending
            </span>
          ) : null}
        </div>
        <p className="truncate text-sm text-foreground/55">{member.email}</p>
      </div>
    </li>
  );
}

function AdministratorsList({
  administrators,
}: {
  administrators: PlatformStaffMember[];
}) {
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
        <AdministratorRow key={member.email} member={member} />
      ))}
    </ul>
  );
}

async function SecurityContent() {
  const [{ sessionUser }, administrators] = await Promise.all([
    getPlatformSession(),
    listPlatformStaff().catch(() => [] as PlatformStaffMember[]),
  ]);
  const actorEmail = sessionUser?.email ?? "";
  const canInvite = isPlatformStaffInviter(actorEmail);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">
          Security
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Administrators
        </h1>
        <p className="text-sm font-medium text-foreground/55">
          Manage who can sign in to this console and invite new platform staff.
        </p>
      </header>

      <InviteAdministrator canInvite={canInvite} />

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-bold text-foreground">Administrators</h2>
        <p className="mt-1 text-sm font-medium text-foreground/55">
          People who can sign in here. School admins on a tenant are listed on
          that school&apos;s page.
        </p>
        <div className="mt-5">
          <AdministratorsList administrators={administrators} />
        </div>
      </section>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <Suspense fallback={<SecurityPageSkeleton />}>
      <SecurityContent />
    </Suspense>
  );
}
