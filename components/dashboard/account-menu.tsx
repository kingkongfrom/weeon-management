"use client";

import { useState } from "react";
import { AccountDrawer } from "@/components/dashboard/account-drawer";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import type { DashboardSessionUser } from "@/lib/dashboard/session-types";

export function AccountMenu({
  initials,
  sessionUser,
  className,
  showName = false,
}: {
  initials: string;
  sessionUser: DashboardSessionUser | null;
  className?: string;
  /** Show the signed-in name beside the avatar (desktop header). */
  showName?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const displayName = sessionUser?.name?.trim() || "Platform staff";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          showName
            ? `flex items-center gap-6 border-0 bg-transparent p-0 text-left outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className ?? ""}`
            : `rounded-xl outline-none ring-offset-2 ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`
        }
        aria-label={showName ? undefined : "Account"}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {showName ? (
          <span className="hidden min-w-0 text-right sm:block">
            <span className="block whitespace-nowrap text-sm font-semibold leading-snug text-foreground">
              {displayName}
            </span>
            <span className="mt-0.5 block whitespace-nowrap text-xs font-medium leading-snug text-foreground/50">
              Weeon Ops
            </span>
          </span>
        ) : null}
        <UserAvatar initials={initials} size="sm" className="shrink-0" />
      </button>
      <AccountDrawer
        open={open}
        onClose={() => setOpen(false)}
        initials={initials}
        sessionUser={sessionUser}
      />
    </>
  );
}
