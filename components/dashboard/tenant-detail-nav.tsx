import Link from "next/link";
import type { ReactNode } from "react";
import { Boxes, CreditCard, History, Users } from "lucide-react";
import { cn } from "@/lib/cn";

export const TENANT_DETAIL_SECTIONS = [
  "modules",
  "people",
  "overview",
  "activity",
] as const;

export type TenantDetailSection = (typeof TENANT_DETAIL_SECTIONS)[number];

const TABS: {
  id: TenantDetailSection;
  label: string;
  icon: ReactNode;
}[] = [
  { id: "modules", label: "Modules", icon: <Boxes size={16} aria-hidden /> },
  { id: "people", label: "People", icon: <Users size={16} aria-hidden /> },
  { id: "overview", label: "Overview", icon: <CreditCard size={16} aria-hidden /> },
  { id: "activity", label: "Activity", icon: <History size={16} aria-hidden /> },
];

export function parseTenantDetailSection(
  value: string | undefined,
): TenantDetailSection {
  if (value && TENANT_DETAIL_SECTIONS.includes(value as TenantDetailSection)) {
    return value as TenantDetailSection;
  }
  return "modules";
}

/** Underline section nav — bookmarkable via `?section=` (replaces segmented pill bar). */
export function TenantDetailNav({
  tenantId,
  active,
}: {
  tenantId: string;
  active: TenantDetailSection;
}) {
  return (
    <nav aria-label="School sections" className="border-b border-border/80">
      <ul className="-mb-px flex flex-wrap gap-x-0 gap-y-1">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <li key={tab.id}>
              <Link
                href={`/dashboard/tenants/${tenantId}?section=${tab.id}`}
                aria-current={isActive ? "page" : undefined}
                scroll={false}
                className={cn(
                  "relative inline-flex items-center gap-2 px-3 py-3 text-sm font-semibold transition-colors sm:px-4",
                  isActive
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-foreground/45 hover:text-foreground/80",
                )}
              >
                <span
                  className={cn(
                    "opacity-80",
                    isActive && "text-brand-600 opacity-100 dark:text-brand-400",
                  )}
                >
                  {tab.icon}
                </span>
                {tab.label}
                {isActive ? (
                  <span
                    aria-hidden
                    className="brand-gradient absolute inset-x-3 bottom-0 h-0.5 rounded-full sm:inset-x-4"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
