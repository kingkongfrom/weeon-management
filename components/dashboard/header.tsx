"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LogoCompact } from "@/components/logo";
import { useT } from "@/lib/i18n/client";

export function Header({ accountSlot }: { accountSlot: ReactNode }) {
  const t = useT();
  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-border/70 bg-surface px-4 pt-[env(safe-area-inset-top,0px)] lg:min-h-16 lg:border-border lg:bg-surface/95 lg:px-8 lg:backdrop-blur-md">
      <Link
        href="/dashboard"
        className="min-w-0 flex-1 transition-opacity hover:opacity-85 lg:hidden"
        aria-label={t.header.ariaBrand}
      >
        <LogoCompact />
      </Link>

      <div className="hidden flex-1 lg:block" aria-hidden />

      {accountSlot}
    </header>
  );
}
