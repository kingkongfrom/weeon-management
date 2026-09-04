"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Settings, ShieldCheck } from "lucide-react";
import { isNavItemActive } from "@/lib/dashboard/nav";
import type { DashboardSessionUser } from "@/lib/dashboard/session-types";

const NAV_ITEMS = [
  { id: "overview" as const, href: "/dashboard", icon: LayoutDashboard, label: "Overview", section: "primary" as const },
  { id: "tenants" as const, href: "/dashboard/tenants", icon: Building2, label: "Tenants", section: "primary" as const },
  { id: "security" as const, href: "/dashboard/security", icon: ShieldCheck, label: "Security", section: "admin" as const },
  { id: "settings" as const, href: "/dashboard/settings", icon: Settings, label: "Settings", section: "admin" as const },
];

export function Sidebar({
  sessionUser,
  footer,
  collapsed = false,
  onNavigate,
}: {
  sessionUser: DashboardSessionUser | null;
  footer?: ReactNode;
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

      {footer ??
        (sessionUser ? (
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
        ) : null)}
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
        className={`flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors ${
          active
            ? "border-brand-500/30 bg-brand-500/15 text-brand-700 group-hover:border-brand-500/40 dark:border-brand-400/30 dark:bg-brand-400/15 dark:text-brand-300 dark:group-hover:border-brand-400/40"
            : "border-foreground/10 bg-foreground/5 text-foreground/50 group-hover:border-foreground/15 group-hover:bg-foreground/10 group-hover:text-foreground/70 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-white/15 dark:group-hover:bg-white/10"
        }`}
      >
        <item.icon size={18} strokeWidth={2} />
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


