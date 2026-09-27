"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Rocket, Settings, ShieldCheck } from "lucide-react";
import { isNavItemActive } from "@/lib/dashboard/nav";
import { useT } from "@/lib/i18n/client";

const MOBILE_ITEMS = [
  { id: "analytics" as const, href: "/dashboard", icon: LayoutDashboard, labelKey: "analytics" as const },
  { id: "onboarding" as const, href: "/dashboard/onboarding", icon: Rocket, labelKey: "onboarding" as const },
  { id: "tenants" as const, href: "/dashboard/tenants", icon: Building2, labelKey: "tenants" as const },
  { id: "security" as const, href: "/dashboard/security", icon: ShieldCheck, labelKey: "security" as const },
  { id: "settings" as const, href: "/dashboard/settings", icon: Settings, labelKey: "settings" as const },
];

export function MobileNav() {
  const pathname = usePathname();
  const t = useT();
  const navHrefs = MOBILE_ITEMS.map((item) => item.href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 px-2 pb-safe pt-2 backdrop-blur-md lg:hidden"
      aria-label={t.nav.ariaMain}
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
                  <item.icon size={20} />
                </span>
                {t.nav[item.labelKey]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


