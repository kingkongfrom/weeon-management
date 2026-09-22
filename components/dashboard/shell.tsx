"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LogoCompact, LogoMark } from "@/components/logo";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";
import {
  useSidebarCollapsed,
  writeSidebarCollapsed,
} from "@/lib/dashboard/sidebar-state";

type DashboardShellProps = {
  children: ReactNode;
  accountSlot: ReactNode;
  sidebarFooter: ReactNode;
  initialSidebarCollapsed?: boolean;
};

export function DashboardShell({
  children,
  accountSlot,
  sidebarFooter,
  initialSidebarCollapsed = false,
}: DashboardShellProps) {
  const collapsed = useSidebarCollapsed(initialSidebarCollapsed);

  useEffect(() => {
    document.documentElement.classList.add("shell-ready");
    return () => document.documentElement.classList.remove("shell-ready");
  }, []);

  return (
    <div className="dashboard-shell bg-background">
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
        <Sidebar sessionUser={null} footer={sidebarFooter} collapsed={collapsed} />
      </aside>

      <div className="dashboard-content">
        <Header accountSlot={accountSlot} />

        <main
          id="main-content"
          tabIndex={-1}
          className="px-4 pt-3 pb-[calc(4.25rem+max(0.75rem,env(safe-area-inset-bottom,0px)))] sm:px-5 sm:pt-4 lg:p-8 lg:pb-8"
        >
          {children}
        </main>

        <MobileNav />
      </div>
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
      {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
    </button>
  );
}
