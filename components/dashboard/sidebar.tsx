"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive } from "@/lib/dashboard/nav";
import type { DashboardSessionUser } from "@/lib/dashboard/session-types";

const NAV_ITEMS = [
  { id: "overview" as const, href: "/dashboard", icon: OverviewIcon, label: "Overview", section: "primary" as const },
  { id: "tenants" as const, href: "/dashboard/tenants", icon: TenantsIcon, label: "Tenants", section: "primary" as const },
  { id: "settings" as const, href: "/dashboard/settings", icon: SettingsIcon, label: "Settings", section: "admin" as const },
];

export function Sidebar({
  sessionUser,
  collapsed = false,
  onNavigate,
}: {
  sessionUser: DashboardSessionUser | null;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const navHrefs = NAV_ITEMS.map((item) => item.href);
  const primary = NAV_ITEMS.filter((item) => item.section === "primary");
  const admin = NAV_ITEMS.filter((item) => item.section === "admin");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav
        className={`flex flex-1 flex-col gap-1 overflow-y-auto ${collapsed ? "items-center px-2 py-3" : "p-4"}`}
        aria-label="Main navigation"
      >
        {collapsed ? null : (
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
            Primary
          </div>
        )}
        {primary.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={isNavItemActive(pathname, item.href, navHrefs)}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        ))}

        {collapsed ? (
          <div className="my-2 h-px w-6 bg-border" />
        ) : (
          <div className="mt-4 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
            Admin
          </div>
        )}
        {admin.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={isNavItemActive(pathname, item.href, navHrefs)}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {sessionUser ? (
        <div className={`border-t border-border ${collapsed ? "p-2" : "p-4"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full brand-gradient text-xs font-bold text-white"
              title={
                collapsed
                  ? [sessionUser.name, sessionUser.email].filter(Boolean).join(" · ")
                  : undefined
              }
            >
              {sessionUser.initials}
            </div>
            {collapsed ? null : (
              <div className="min-w-0">
                {sessionUser.name ? (
                  <p className="truncate text-sm font-semibold text-foreground">
                    {sessionUser.name}
                  </p>
                ) : null}
                {sessionUser.email ? (
                  <p className="truncate text-xs text-foreground/50">
                    {sessionUser.email}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NavItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={`group relative flex items-center rounded-xl text-sm font-semibold transition-all ${
        collapsed ? "h-10 w-10 justify-center" : "gap-3 px-3 py-2.5"
      } ${
        active
          ? "bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300"
          : "text-foreground/70 hover:bg-surface-muted hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          active
            ? "bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300"
            : "bg-surface-muted text-foreground/50 group-hover:bg-surface-elevated group-hover:text-foreground/70"
        }`}
      >
        <item.icon />
      </span>
      {collapsed ? (
        <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-lg border border-border bg-surface px-2 py-1 text-xs font-semibold text-foreground group-hover:block group-focus-within:block">
          {item.label}
        </span>
      ) : (
        item.label
      )}
    </Link>
  );
}

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function TenantsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 21h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
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
      <path
        d="M10 9h.01M14 9h.01M10 13h.01M14 13h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
