"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { LogoCompact, LogoMark } from "@/components/logo";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";
import {
  useSidebarCollapsed,
  writeSidebarCollapsed,
} from "@/lib/dashboard/sidebar-state";
import type { ThemePreference } from "@/lib/theme/theme";

type DashboardShellProps = {
  children: ReactNode;
  accountSlot: ReactNode;
  notificationSlot: ReactNode;
  sidebarFooter: ReactNode;
  initialTheme: ThemePreference;
  initialSidebarCollapsed?: boolean;
};

export function DashboardShell({
  children,
  accountSlot,
  notificationSlot,
  sidebarFooter,
  initialTheme,
  initialSidebarCollapsed = false,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const collapsed = useSidebarCollapsed(initialSidebarCollapsed);

  useEffect(() => {
    document.documentElement.classList.add("shell-ready");
    return () => document.documentElement.classList.remove("shell-ready");
  }, []);

  return (
    <div className="dashboard-shell flex min-h-screen flex-col bg-background lg:flex-row">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex">
        <div
          className={`flex h-16 items-center border-b border-border ${
            collapsed ? "justify-center px-2" : "px-4"
          }`}
        >
          <Link
            href="/dashboard"
            className="transition-opacity hover:opacity-85"
            aria-label="Weeon Ops"
          >
            {collapsed ? <LogoMark /> : <LogoCompact />}
          </Link>
        </div>
        <SidebarToggle collapsed={collapsed} />
        <Sidebar
          sessionUser={null}
          footer={sidebarFooter}
          collapsed={collapsed}
          onNavigate={() => setMobileMenuOpen(false)}
        />
      </aside>

      <div className="dashboard-content flex flex-1 flex-col transition-[padding] duration-200">
        <Header
          accountSlot={accountSlot}
          notificationSlot={notificationSlot}
          initialTheme={initialTheme}
          onMenuToggle={() => setMobileMenuOpen((v) => !v)}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pt-6 lg:p-8 lg:pb-8"
        >
          {children}
        </main>

        <MobileNav />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex w-[18rem] max-w-[80vw] flex-col bg-surface">
            <div className="flex h-16 items-center border-b border-border px-5">
              <LogoCompact />
            </div>
            <Sidebar
              sessionUser={null}
              footer={sidebarFooter}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
          <button
            type="button"
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          />
        </div>
      )}
    </div>
  );
}

function SidebarToggle({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      type="button"
      onClick={() => writeSidebarCollapsed(!collapsed)}
      className="absolute top-8 right-0 z-50 flex h-7 w-7 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-foreground/55 transition-colors hover:bg-surface-muted hover:text-foreground"
      aria-label={collapsed ? "Expand menu" : "Collapse menu"}
      title={collapsed ? "Expand menu" : "Collapse menu"}
    >
      <CollapseIcon flipped={collapsed} />
    </button>
  );
}

function CollapseIcon({ flipped }: { flipped: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={flipped ? "rotate-180" : undefined}
    >
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
