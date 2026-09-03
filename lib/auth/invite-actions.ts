"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/session";
import {
  isAllowedStaffEmailDomain,
  isPlatformStaffInviter,
} from "@/lib/auth/policy";
import { isAllowedStaffEmailDomainError } from "@/lib/auth/messages";
import { invitePlatformStaff } from "@/lib/auth/platform-staff";
import { opsAppOrigin } from "@/lib/auth/ops-origin";
import { passwordSchema } from "@/lib/auth/password";
import {
  consumeOpsToken,
  peekOpsToken,
  markInvitedOpsMemberAccepted,
  getInvitedOpsMember,
} from "@/lib/auth/ops-staff-store";
import { resolveOrCreateAuthUser, setOpsStaffPassword } from "@/lib/auth/auth-user";

export type InviteAdministratorState = { message?: string; error?: string } | null;

export async function inviteAdministratorAction(
  _prev: InviteAdministratorState,
  formData: FormData,
): Promise<InviteAdministratorState> {
  const { sessionUser } = await getPlatformSession();
  const actorEmail = sessionUser?.email ?? "";

  if (!isPlatformStaffInviter(actorEmail)) {
    return { error: "Only the primary administrator can send invitations." };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter an email address." };
  }

  if (!isAllowedStaffEmailDomain(email)) {
    return { error: isAllowedStaffEmailDomainError() };
  }

  const result = await invitePlatformStaff(email, await currentOrigin(), actorEmail);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/security");
  return {
    message: result.resent
      ? `Invitation resent to ${email.toLowerCase()}. They can set a password from the branded email.`
      : `Invitation sent to ${email.toLowerCase()}. They can set a password from the branded email.`,
  };
}

export type AcceptInviteState = { error?: string } | null;

export async function validateInviteToken(
  token: string,
): Promise<{ ok: true; email?: string } | { ok: false; error?: string }> {
  const peeked = await peekOpsToken(token, "invite");
  if (!peeked) return { ok: false, error: "This invitation link is no longer valid." };
  return { ok: true, email: peeked.email };
}

export async function acceptInviteAction(
  _prev: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const password = String(formData.get("password") ?? "");
  const token = String(formData.get("token") ?? "");

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Password does not meet the requirements." };
  }

  const peeked = await peekOpsToken(token, "invite");
  if (!peeked) {
    return { error: "This invitation link is no longer valid." };
  }

  let userId = (await getInvitedOpsMember(peeked.email))?.userId ?? null;
  if (!userId) {
    const user = await resolveOrCreateAuthUser(peeked.email);
    userId = user?.id ?? null;
  }
  if (!userId) {
    return { error: "We could not prepare that account. Ask the owner to resend the invite." };
  }

  const updated = await setOpsStaffPassword(userId, password);
  if (!updated) {
    return { error: "We could not set your password. Ask the owner to resend the invite." };
  }

  const consumed = await consumeOpsToken(token, "invite");
  if (!consumed) {
    return { error: "This invitation link is no longer valid." };
  }

  await markInvitedOpsMemberAccepted(peeked.email, userId);

  const supabase = await createSessionClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: peeked.email,
    password,
  });
  if (signInError) {
    redirect("/?invited=1");
  }
  redirect("/dashboard");
}

async function currentOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origin = host ? `${proto}://${host}` : null;
  return opsAppOrigin(origin);
}
