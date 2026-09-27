"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, KeyRound, LayoutDashboard, Rocket, Settings, ShieldCheck } from "lucide-react";
import { isNavItemActive } from "@/lib/dashboard/nav";
import { useT } from "@/lib/i18n/client";

const NAV_ITEMS = [
  { id: "analytics" as const, href: "/dashboard", icon: LayoutDashboard, labelKey: "analytics" as const, section: "primary" as const },
  { id: "onboarding" as const, href: "/dashboard/onboarding", icon: Rocket, labelKey: "onboarding" as const, section: "primary" as const },
  { id: "tenants" as const, href: "/dashboard/tenants", icon: Building2, labelKey: "tenants" as const, section: "primary" as const },
  { id: "access" as const, href: "/dashboard/access", icon: KeyRound, labelKey: "access" as const, section: "admin" as const },
  { id: "security" as const, href: "/dashboard/security", icon: ShieldCheck, labelKey: "security" as const, section: "admin" as const },
  { id: "settings" as const, href: "/dashboard/settings", icon: Settings, labelKey: "settings" as const, section: "admin" as const },
];

export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useT();
  const navHrefs = NAV_ITEMS.map((item) => item.href);
  const primary = NAV_ITEMS.filter((item) => item.section === "primary");
  const admin = NAV_ITEMS.filter((item) => item.section === "admin");

  return (
    <nav
      className={`flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto ${collapsed ? "items-center px-2 py-3" : "p-4"}`}
      aria-label={t.nav.ariaMain}
    >
      {collapsed ? null : (
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
          {t.nav.sectionPrimary}
        </div>
      )}
      {primary.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          label={t.nav[item.labelKey]}
          active={isNavItemActive(pathname, item.href, navHrefs)}
          collapsed={collapsed}
          onClick={onNavigate}
        />
      ))}

      {collapsed ? (
        <div className="my-2 h-px w-6 bg-border" />
      ) : (
        <div className="mt-4 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
          {t.nav.sectionAdmin}
        </div>
      )}
      {admin.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          label={t.nav[item.labelKey]}
          active={isNavItemActive(pathname, item.href, navHrefs)}
          collapsed={collapsed}
          onClick={onNavigate}
        />
      ))}
    </nav>
  );
}

function NavItem({
  item,
  label,
  active,
  collapsed,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number];
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
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
          {label}
        </span>
      ) : (
        label
      )}
    </Link>
  );
}
