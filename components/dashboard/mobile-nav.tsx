"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  CalendarClock,
  Home,
  KeyRound,
  LayoutDashboard,
  Mail,
  Menu,
  Rocket,
  ShieldCheck,
  X,
} from "lucide-react";
import { isNavItemActive } from "@/lib/dashboard/nav";
import { useT } from "@/lib/i18n/client";
import type { ObservabilityNavState } from "@/lib/observability/observability-nav";

/**
 * Phone navigation.
 *
 * Nine icons in a fixed row were unreadable at 320px, so the bar carries only
 * the four places Ops visits during a day — Inicio, Agenda, Colegios, Correo —
 * plus a **Menú** button that opens the remaining destinations as full-width
 * rows (icon, label, description). Same destinations, less noise.
 */
const TABS = [
  { id: "dashboard" as const, href: "/dashboard", icon: Home, labelKey: "dashboardShort" as const },
  { id: "meetings" as const, href: "/dashboard/meetings", icon: CalendarClock, labelKey: "meetingsShort" as const },
  { id: "tenants" as const, href: "/dashboard/tenants", icon: Building2, labelKey: "tenants" as const },
  { id: "email" as const, href: "/dashboard/email", icon: Mail, labelKey: "emailShort" as const },
];

const MENU_ITEMS = [
  {
    id: "dashboard" as const,
    href: "/dashboard",
    icon: Home,
    labelKey: "dashboard" as const,
    section: "acceso" as const,
  },
  {
    id: "meetings" as const,
    href: "/dashboard/meetings",
    icon: CalendarClock,
    labelKey: "meetings" as const,
    section: "acceso" as const,
  },
  {
    id: "tenants" as const,
    href: "/dashboard/tenants",
    icon: Building2,
    labelKey: "tenants" as const,
    section: "acceso" as const,
  },
  {
    id: "email" as const,
    href: "/dashboard/email",
    icon: Mail,
    labelKey: "email" as const,
    section: "acceso" as const,
  },
  {
    id: "analytics" as const,
    href: "/dashboard/analytics",
    icon: LayoutDashboard,
    labelKey: "analytics" as const,
    section: "operacion" as const,
  },
  {
    id: "onboarding" as const,
    href: "/dashboard/onboarding",
    icon: Rocket,
    labelKey: "onboarding" as const,
    section: "operacion" as const,
  },
  {
    id: "observability" as const,
    href: "/dashboard/observability",
    icon: Activity,
    labelKey: "observability" as const,
    section: "operacion" as const,
  },
  {
    id: "access" as const,
    href: "/dashboard/access",
    icon: KeyRound,
    labelKey: "access" as const,
    section: "admin" as const,
  },
  {
    id: "security" as const,
    href: "/dashboard/security",
    icon: ShieldCheck,
    labelKey: "security" as const,
    section: "admin" as const,
  },
];

const ALL_HREFS = MENU_ITEMS.map((item) => item.href);

export function MobileNav({
  observabilityNav,
}: {
  observabilityNav?: ObservabilityNavState;
}) {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuVisible = MENU_ITEMS.some((item) => item.section !== "acceso" && isNavItemActive(pathname, item.href, ALL_HREFS));


  // Escape closes, focus returns to the trigger, page scroll is locked.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  const sections = [
    { id: "acceso" as const, label: t.nav.sectionPrimary },
    { id: "operacion" as const, label: t.nav.sectionOperations },
    { id: "admin" as const, label: t.nav.sectionAdmin },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 px-1.5 pb-safe pt-1.5 backdrop-blur-md lg:hidden"
        aria-label={t.nav.ariaMain}
      >
        <ul className="flex items-stretch justify-between gap-1">
          {TABS.map((item) => {
            const active = isNavItemActive(pathname, item.href, ALL_HREFS);
            return (
              <li key={item.id} className="min-w-0 flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold leading-tight transition-colors ${
                    active
                      ? "text-brand-600 dark:text-brand-300"
                      : "text-foreground/50 active:text-foreground/70"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={`relative flex h-7 w-10 items-center justify-center rounded-full transition-all ${
                      active
                        ? "bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300"
                        : "text-foreground/50"
                    }`}
                  >
                    <item.icon size={20} aria-hidden />
                  </span>
                  <span className="max-w-full truncate">{t.nav[item.labelKey]}</span>
                </Link>
              </li>
            );
          })}

          <li className="min-w-0 flex-1">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-haspopup="dialog"
              className={`flex w-full flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold leading-tight transition-colors ${
                open || menuVisible
                  ? "text-brand-600 dark:text-brand-300"
                  : "text-foreground/50 active:text-foreground/70"
              }`}
            >
              <span
                className={`relative flex h-7 w-10 items-center justify-center rounded-full transition-all ${
                  open || menuVisible
                    ? "bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300"
                    : "text-foreground/50"
                }`}
              >
                {observabilityNav?.showAlert && !menuVisible ? (
                  <span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-error ring-2 ring-surface" aria-hidden />
                ) : null}
                <Menu size={20} aria-hidden />
              </span>
              <span className="max-w-full truncate">{t.nav.more}</span>
            </button>
          </li>
        </ul>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
          <button
            type="button"
            aria-label={t.nav.closeMenu}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
          />
          <div
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-border bg-surface shadow-elevated"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
              <p className="text-base font-bold text-foreground">{t.nav.menu}</p>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.nav.closeMenu}
                className="grid h-9 w-9 place-items-center rounded-lg text-foreground/50 transition-colors active:bg-surface-muted"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 [-webkit-overflow-scrolling:touch]">
              {sections.map((section) => (
                <div key={section.id} className="py-1">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                    {section.label}
                  </p>
                  <ul>
                    {MENU_ITEMS.filter((item) => item.section === section.id).map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const badge = item.id === "observability" && observabilityNav?.showAlert;
                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors ${
                              active
                                ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-200"
                                : "text-foreground/80 active:bg-surface-muted"
                            }`}
                          >
                            <span className="relative">
                              <item.icon
                                size={20}
                                className={active ? "text-brand-600 dark:text-brand-300" : "text-foreground/45"}
                                aria-hidden
                              />
                              {badge ? (
                                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-error" aria-hidden />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{t.nav[item.labelKey]}</span>
                            {active ? (
                              <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                {t.nav.here}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
