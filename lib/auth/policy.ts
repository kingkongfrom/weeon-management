// Auth policy for Weeon Management (platform staff).
//
// The ops console is internal-only. It responds to staff emails on the
// weeon.school domain, and by default only to the individual accounts in the
// allow list below. Keep this strict — this console reads CROSS-TENANT data.

export const ALLOWED_EMAIL_DOMAIN = "weeon.school";

/** Product name used in the ops UI and branded transactional email. */
export const OPS_CONSOLE_APP_NAME = "Weeon Ops";

/** Primary ops owner — only this account may invite new platform staff. */
export const PLATFORM_STAFF_INVITER_EMAIL = "eduardo@weeon.school";

/** Hard cap on ops console administrator accounts. */
export const MAX_PLATFORM_STAFF = 3;

/** One Weeon Ops administrator. Lives in this repo — never a tenant profile. */
export interface PlatformStaffRecord {
    email: string;
    name: string | null;
    role: string | null;
}

/**
 * Ops-console staff directory. This is the Settings admin list.
 * Isolated from school `profiles` / tenant administrators (including the
 * demo-school accounts used to test weeon-admin).
 */
const PLATFORM_STAFF_DIRECTORY: readonly PlatformStaffRecord[] = [
    {
        email: "eduardo@weeon.school",
        name: "Eduardo Varela Da Silva",
        role: "Co-founder · Sr Software Developer",
    },
];

const DEFAULT_ALLOWED_STAFF_EMAILS: readonly string[] = PLATFORM_STAFF_DIRECTORY.map(
    (staff) => staff.email,
);

function staffDirectoryByEmail(): ReadonlyMap<string, PlatformStaffRecord> {
    return new Map(
        PLATFORM_STAFF_DIRECTORY.map((staff) => [normalizeEmail(staff.email), staff]),
    );
}

function allowedStaffEmails(): ReadonlySet<string> {
    const raw = process.env.AUTH_ALLOWED_STAFF_EMAILS;
    const list =
        raw && raw.trim()
            ? raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
            : DEFAULT_ALLOWED_STAFF_EMAILS;
    return new Set(list);
}

/** Normalize to lowercase for comparisons. */
export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/** True if the email falls on the allowed staff domain. */
export function isAllowedStaffEmailDomain(email: string): boolean {
    return normalizeEmail(email).endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

/** True if the email is in the individual staff allow list. */
export function isAllowedStaffEmail(email: string): boolean {
    const normalized = normalizeEmail(email);
    return allowedStaffEmails().has(normalized);
}

/** True when the signed-in user may invite new platform administrators. */
export function isPlatformStaffInviter(email: string): boolean {
    return normalizeEmail(email) === PLATFORM_STAFF_INVITER_EMAIL;
}

/** Emails from the env/default bootstrap allow list (for staff counting). */
export function listConfiguredStaffEmails(): readonly string[] {
    return [...allowedStaffEmails()];
}

/** Ops staff rows for Settings — directory in this repo, not tenant profiles. */
export function listConfiguredStaff(): PlatformStaffRecord[] {
    const directory = staffDirectoryByEmail();
    return listConfiguredStaffEmails()
        .filter((email) => isAllowedStaffEmailDomain(email))
        .map((email) => {
            const normalized = normalizeEmail(email);
            const known = directory.get(normalized);
            return {
                email: normalized,
                name: known?.name ?? null,
                role: known?.role ?? null,
            };
        });
}

/** Display name for a staff account from this repo's directory, or null. */
export function staffNameFor(email: string): string | null {
    return staffDirectoryByEmail().get(normalizeEmail(email))?.name ?? null;
}

/** Role label for a staff account (their position on the org), or null. */
export function staffRoleFor(email: string): string | null {
    return staffDirectoryByEmail().get(normalizeEmail(email))?.role ?? null;
}

/** Development bypass (dev only, ignored in production). */
export function isAuthDisabled(): boolean {
    if (process.env.NODE_ENV === "production") return false;
    return process.env.WEEON_AUTH_DISABLED === "true";
}

/** True when /dashboard should require a platform session. */
export function isDashboardAuthEnforced(): boolean {
    if (isAuthDisabled()) return false;
    return Boolean(
        process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_ANON_KEY?.trim(),
    );
}
