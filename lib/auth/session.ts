import "server-only";

import { cache } from "react";
import {redirect} from "next/navigation";
import type {User} from "@supabase/supabase-js";
import {createSessionClient} from "@/lib/supabase/session";
import type {DashboardSessionUser} from "@/lib/dashboard/session-types";
import {
    isAllowedStaffEmailDomain,
    normalizeEmail,
    staffNameFor,
    staffRoleFor,
} from "@/lib/auth/policy";
import {canAccessOpsConsole} from "@/lib/auth/platform-staff";
import {getMfaAssurance, listTotpFactors} from "@/lib/auth/mfa";

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
        role: staffRoleFor(email),
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
 *
 * When the account has a verified TOTP factor, the session must also be at
 * **aal2** (second factor passed). An aal1 session — password only — is treated
 * as unauthenticated here, so a half-finished MFA login cannot reach the console
 * by navigating straight to a dashboard URL. Further factor enrollment (which
 * happens at aal1) is unaffected because that lives behind an already-verified
 * session.
 */
export const getPlatformSession = cache(async function getPlatformSession() {
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

    // Enforce the second factor when one is enrolled. Skipped entirely when the
    // user has no verified factor, so this is a no-op until they opt in.
    try {
        const status = await listTotpFactors(supabase);
        if (status.enrolled) {
            const assurance = await getMfaAssurance(supabase);
            if (assurance.currentLevel !== "aal2") {
                return {user: null, sessionUser: null};
            }
        }
    } catch {
        // MFA read failure must not lock staff out of the console.
    }

    return {user, sessionUser: toSessionUser(user)};
});

/** Server-component guard for the base app (login at `/`). */
export async function requirePlatformSession() {
    const {user} = await getPlatformSession();
    if (!user) redirect("/");
    return user;
}
