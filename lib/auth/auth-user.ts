import "server-only";

import type { User } from "@supabase/supabase-js";
import { createPlatformClient } from "@/lib/supabase/platform";
import { normalizeEmail } from "@/lib/auth/policy";

/**
 * Resolve or create an Auth user for an ops-staff email without sending
 * Supabase's generic invite/recovery mail (`generateLink` does not send).
 *
 * Shared Auth project: the same email may already exist as a school user.
 * That does not make them ops staff — callers must persist ops membership
 * separately (directory + `data/ops-staff.json`).
 */
export async function resolveOrCreateAuthUser(emailInput: string): Promise<User | null> {
  const email = normalizeEmail(emailInput);
  const existing = await findAuthUserByEmail(email);
  if (existing) return existing;

  const client = createPlatformClient();
  const recovery = await client.auth.admin.generateLink({ type: "recovery", email });
  if (recovery.data?.user) {
    return recovery.data.user;
  }

  const invite = await client.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { invited_to: "weeon-management" } },
  });
  if (invite.data?.user) {
    return invite.data.user;
  }

  const created = await client.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { invited_to: "weeon-management" },
  });
  return created.data.user ?? null;
}

/** GoTrue admin lookup by email. Does not send mail. */
async function findAuthUserByEmail(email: string): Promise<User | null> {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  try {
    const response = await fetch(
      `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
        },
      },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      users?: User[];
      user?: User;
      id?: string;
      email?: string;
    };
    if (Array.isArray(payload.users) && payload.users.length > 0) {
      return (
        payload.users.find((user) => normalizeEmail(user.email ?? "") === email) ??
        payload.users[0]
      );
    }
    if (payload.user?.id) return payload.user;
    if (payload.id) return payload as User;
  } catch {
    return null;
  }
  return null;
}

export async function grantOpsStaffMetadata(user: User): Promise<User> {
  const client = createPlatformClient();
  const { data, error } = await client.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      platform_staff: true,
    },
  });
  if (error || !data.user) return user;
  return data.user;
}

export async function setOpsStaffPassword(userId: string, password: string): Promise<boolean> {
  const client = createPlatformClient();
  const { error } = await client.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    app_metadata: { platform_staff: true },
  });
  return !error;
}
