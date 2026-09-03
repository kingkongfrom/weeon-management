import "server-only";

import {redirect} from "next/navigation";
import type {User} from "@supabase/supabase-js";
import {createSessionClient} from "@/lib/supabase/session";
import type {DashboardSessionUser} from "@/lib/dashboard/session-types";
import {
    isAllowedStaffEmailDomain,
    normalizeEmail,
    staffNameFor,
} from "@/lib/auth/policy";
import {canAccessOpsConsole} from "@/lib/auth/platform-staff";

/** Derive a display model for the ops UI from a Supabase Auth user. */
export function toSessionUser(user: User): DashboardSessionUser | null {
    const email = normalizeEmail(user.email ?? "");
    const directoryName = staffNameFor(email);
    const metaName = user.user_metadata?.name ?? user.user_metadata?.full_name;
    const name = directoryName ?? (typeof metaName === "string" && metaName ? metaName : null);
    return {
        name,
        email: email || null,
        initials: initialsFor(name, email),
    };
}

function initialsFor(name: string | null, email: string): string {
    if (name?.trim()) {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        return parts
            .slice(0, 2)
            .map((p) => p[0])
            .join("")
            .toUpperCase();
    }
    return email
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase();
}

/**
 * Load the valid platform staff session for Server Components.
 * Returns null when unauthenticated or the signed-in email is not allowed.
 */
export async function getPlatformSession() {
    const supabase = await createSessionClient();
    const {
        data: {user},
        error,
    } = await supabase.auth.getUser();

    if (error || !user) return {user: null, sessionUser: null};

    const email = normalizeEmail(user.email ?? "");
    const allowed =
        isAllowedStaffEmailDomain(email) && (await canAccessOpsConsole(email));

    if (!allowed) {
        // A signed-in but unauthorized identity should not see the ops UI.
        await supabase.auth.signOut();
        return {user: null, sessionUser: null};
    }

    return {user, sessionUser: toSessionUser(user)};
}

/** Server-component guard for the base app (login at `/`). */
export async function requirePlatformSession() {
    const {user} = await getPlatformSession();
    if (!user) redirect("/");
    return user;
}
