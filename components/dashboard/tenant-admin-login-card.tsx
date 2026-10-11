import { KeyRound } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import { formatOpsDateTime } from "@/lib/datetime/costa-rica";
import type { TenantAdminLoginSignal } from "@/lib/platform/tenant-admin-auth";

function formatLastSignIn(iso: string | null): string {
  if (!iso) return "Never signed in (Auth)";
  return formatOpsDateTime(iso);
}

/** Latest sign-in per school admin from Supabase Auth (plus `auth.login` rows in School activity). */
export function TenantAdminLoginCard({ admins }: { admins: TenantAdminLoginSignal[] }) {
  return (
    <SectionCard
      title="Admin login (Auth)"
      description="Last successful sign-in per school administrator in Supabase Auth. New sign-ins and sign-outs also append to School activity below."
      icon={<KeyRound size={16} />}
      tone="brand"
    >
      {admins.length === 0 ? (
        <p className="px-4 py-4 text-sm font-medium text-foreground/45 sm:px-5">
          No school administrators on this tenant.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {admins.map((admin) => (
            <li
              key={admin.id}
              className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{admin.name}</p>
                <p className="truncate text-xs text-foreground/50">{admin.email}</p>
              </div>
              <p className="shrink-0 text-xs font-medium text-foreground/55 sm:text-right">
                {formatLastSignIn(admin.lastSignInAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
