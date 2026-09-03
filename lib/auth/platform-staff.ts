import "server-only";

import {
  isAllowedStaffEmail,
  isAllowedStaffEmailDomain,
  listConfiguredStaff,
  listConfiguredStaffEmails,
  MAX_PLATFORM_STAFF,
  normalizeEmail,
  PLATFORM_STAFF_INVITER_EMAIL,
} from "@/lib/auth/policy";
import { grantOpsStaffMetadata, resolveOrCreateAuthUser } from "@/lib/auth/auth-user";
import { sendOpsInviteEmail } from "@/lib/email/invite-email";
import {
  getInvitedOpsMember,
  INVITE_TTL_MS,
  listInvitedOpsMembers,
  mintOpsToken,
  upsertInvitedOpsMember,
} from "@/lib/auth/ops-staff-store";

function hasServiceRole(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

function memberInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 0) {
      return parts
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
    }
  }
  const base = email.split("@")[0];
  return base.trim().slice(0, 2).toUpperCase() || "P";
}

/** One ops console administrator shown on the settings page. */
export interface PlatformStaffMember {
  name: string | null;
  email: string;
  /** Role/position on the org (display), if known for this staff account. */
  role: string | null;
  /** Initials derived from the name or email local-part for an avatar. */
  initials: string;
  /** True for the primary account allowed to invite others. */
  isPrimary: boolean;
  /** Waiting for an invited account to confirm / set a password. */
  pending: boolean;
}

/** Distinct ops-console staff emails (directory + invited). Never tenant profiles. */
export async function listPlatformStaffEmails(): Promise<string[]> {
  const emails = new Set<string>();
  for (const email of listConfiguredStaffEmails()) {
    if (isAllowedStaffEmailDomain(email)) emails.add(normalizeEmail(email));
  }
  for (const member of await listInvitedOpsMembers()) {
    if (isAllowedStaffEmailDomain(member.email)) emails.add(member.email);
  }
  return [...emails].sort();
}

export async function countPlatformStaff(): Promise<number> {
  return (await listPlatformStaffEmails()).length;
}

/** Ops console administrators from this repo's directory plus invited staff. */
export async function listPlatformStaff(): Promise<PlatformStaffMember[]> {
  const primary = normalizeEmail(PLATFORM_STAFF_INVITER_EMAIL);
  const invited = await listInvitedOpsMembers();
  const directoryEmails = new Set(
    listConfiguredStaff().map((staff) => normalizeEmail(staff.email)),
  );

  const members: PlatformStaffMember[] = listConfiguredStaff().map((staff) => {
    const name = staff.name?.trim() || null;
    return {
      name,
      email: staff.email,
      role: staff.role,
      initials: memberInitials(name, staff.email),
      isPrimary: staff.email === primary,
      pending: false,
    };
  });

  for (const row of invited) {
    if (directoryEmails.has(row.email)) continue;
    if (!isAllowedStaffEmailDomain(row.email)) continue;
    const name = row.name?.trim() || null;
    members.push({
      name,
      email: row.email,
      role: null,
      initials: memberInitials(name, row.email),
      isPrimary: false,
      pending: row.pending,
    });
  }

  return members.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    if (a.pending !== b.pending) return a.pending ? 1 : -1;
    return a.email.localeCompare(b.email);
  });
}

/** Whether the email may sign in to the ops console. */
export async function canAccessOpsConsole(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!isAllowedStaffEmailDomain(normalized)) return false;
  if (isAllowedStaffEmail(normalized)) return true;

  const invited = await getInvitedOpsMember(normalized);
  return Boolean(invited && !invited.pending);
}

export type InvitePlatformStaffResult =
  | { ok: true; resent?: boolean }
  | { ok: false; error: string };

/** Invite a new @weeon.school platform administrator with a branded email. */
export async function invitePlatformStaff(
  emailRaw: string,
  origin: string,
  inviterEmail?: string,
): Promise<InvitePlatformStaffResult> {
  const email = normalizeEmail(emailRaw);

  if (!isAllowedStaffEmailDomain(email)) {
    return { ok: false, error: "Only @weeon.school addresses can receive credentials." };
  }

  if (!hasServiceRole()) {
    return {
      ok: false,
      error: "Invitations require the platform service-role key on the server.",
    };
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return {
      ok: false,
      error: "Invitations require RESEND_API_KEY so we can send a branded Weeon email.",
    };
  }

  const existing = await getInvitedOpsMember(email);
  const directoryHit = isAllowedStaffEmail(email);

  if (directoryHit || (existing && !existing.pending)) {
    return { ok: false, error: "That account already has ops console access." };
  }

  const staffCount = await countPlatformStaff();
  if (!existing && staffCount >= MAX_PLATFORM_STAFF) {
    return {
      ok: false,
      error: `The ops console already has the maximum of ${MAX_PLATFORM_STAFF} administrators.`,
    };
  }

  let userId: string | null = existing?.userId ?? null;
  try {
    const user = await resolveOrCreateAuthUser(email);
    if (user) {
      const granted = await grantOpsStaffMetadata(user);
      userId = granted.id;
    }
  } catch (err) {
    console.error("[ops-invite] auth user resolve failed", err);
  }

  await upsertInvitedOpsMember({
    email,
    userId,
    name: existing?.name ?? null,
    pending: true,
  });

  const minted = await mintOpsToken(email, "invite", INVITE_TTL_MS, userId);
  const inviteUrl = `${origin.replace(/\/+$/, "")}/accept-invite?token=${encodeURIComponent(minted.token)}`;
  const sent = await sendOpsInviteEmail({
    to: email,
    inviteUrl,
    inviterEmail,
  });

  if (!sent.success) {
    console.error("[ops-invite] branded email failed", sent.error);
    return { ok: false, error: "Could not send the branded invitation email. Try again later." };
  }

  return { ok: true, resent: Boolean(existing?.pending) };
}
