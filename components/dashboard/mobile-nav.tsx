"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive } from "@/lib/dashboard/nav";

const MOBILE_ITEMS = [
  { id: "overview" as const, href: "/dashboard", icon: OverviewIcon, label: "Overview" },
  { id: "tenants" as const, href: "/dashboard/tenants", icon: TenantsIcon, label: "Tenants" },
  { id: "settings" as const, href: "/dashboard/settings", icon: SettingsIcon, label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const navHrefs = MOBILE_ITEMS.map((item) => item.href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 px-2 pb-safe pt-2 backdrop-blur-md lg:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-around">
        {MOBILE_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href, navHrefs);
          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors ${
                  active
                    ? "text-brand-600 dark:text-brand-300"
                    : "text-foreground/50 hover:text-foreground/70"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                    active
                      ? "bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300"
                      : "text-foreground/50"
                  }`}
                >
                  <item.icon />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function OverviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function TenantsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6 21V7l6-4 6 4v14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 21v-6h4v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
