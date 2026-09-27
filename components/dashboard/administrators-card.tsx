import { Mail, ShieldCheck, Users } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import { AddAdministrator } from "@/components/dashboard/add-administrator";
import { RemoveAdministratorButton } from "@/components/dashboard/remove-administrator";
import type { TenantAdminContact } from "@/lib/domain";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * School administrators for a tenant. Ops adds/removes admins here; the school
 * ERP only shows a read-only list. The last admin cannot be removed.
 * School-level suspend/reactivate lives on the Overview tab (School access).
 */
export function AdministratorsCard({
  admins,
  tenantId,
}: {
  admins: TenantAdminContact[];
  tenantId: string;
}) {
  const canRemove = admins.length > 1;

  return (
    <SectionCard
      title="Administrators"
      description="School admins for this tenant — managed by Ops."
      icon={<Users size={16} />}
      tone="brand"
      action={<AddAdministrator tenantId={tenantId} />}
    >
      {admins.length === 0 ? (
        <p className="px-4 py-4 text-sm font-medium text-foreground/45 sm:px-5">
          No school administrators found.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {admins.map((admin, index) => (
            <li
              key={`${admin.email}-${index}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/40 sm:px-5"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white dark:bg-brand-500"
                aria-hidden
              >
                {initialsFor(admin.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {admin.name}
                </p>
                {admin.email ? (
                  <a
                    href={`mailto:${admin.email}`}
                    className="flex items-center gap-1 truncate text-xs font-medium text-foreground/50 hover:text-brand-600 hover:underline dark:hover:text-brand-300"
                  >
                    <Mail size={11} aria-hidden />
                    {admin.email}
                  </a>
                ) : (
                  <p className="truncate text-xs font-medium text-foreground/50">—</p>
                )}
              </div>
              <span className="hidden shrink-0 items-center gap-1 rounded-full bg-success-subtle px-2 py-0.5 text-[11px] font-semibold text-success sm:inline-flex">
                <ShieldCheck size={11} />
                Admin
              </span>
              {canRemove ? (
                <RemoveAdministratorButton
                  tenantId={tenantId}
                  profileId={admin.id}
                  name={admin.name}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-border/60 bg-surface-muted/40 px-4 py-2.5 text-[11px] font-medium text-foreground/50 sm:px-5">
        {admins.length <= 1
          ? "The last administrator cannot be removed — add another first."
          : "New admins set their password on first login."}
      </p>
    </SectionCard>
  );
}
