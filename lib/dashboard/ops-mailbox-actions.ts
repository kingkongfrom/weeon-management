"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPlatformSession } from "@/lib/auth/session";
import { createOpsEmailLabel } from "@/lib/platform/email-labels";
import { saveOpsMailboxSettings } from "@/lib/platform/ops-mailbox-settings";

const OPS_EMAIL_PATH = "/dashboard/email";
const OPS_EMAIL_SETTINGS_PATH = "/dashboard/email/configuracion";

async function requireOpsActor() {
  const { user, sessionUser } = await getPlatformSession();
  if (!user) return { ok: false as const, error: "Your session expired. Sign in again." };
  const email = sessionUser?.email?.trim() ?? "";
  if (!email) return { ok: false as const, error: "Your account has no email on file." };
  return { ok: true as const, userId: user.id, email };
}

export async function saveOpsSignatureAction(
  signatureText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireOpsActor();
  if (!actor.ok) return actor;
  const result = await saveOpsMailboxSettings({
    ownerAuthUserId: actor.userId,
    ownerEmail: actor.email,
    patch: { signatureText: signatureText.trim() },
  });
  if (!result.ok) return result;
  revalidatePath(OPS_EMAIL_PATH);
  revalidatePath(OPS_EMAIL_SETTINGS_PATH);
  return { ok: true };
}

export async function saveOpsAutoReplyAction(input: {
  enabled: boolean;
  start: string | null;
  end: string | null;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireOpsActor();
  if (!actor.ok) return actor;
  const result = await saveOpsMailboxSettings({
    ownerAuthUserId: actor.userId,
    ownerEmail: actor.email,
    patch: {
      autoReplyEnabled: input.enabled,
      autoReplyStart: input.start,
      autoReplyEnd: input.end,
      autoReplyText: input.text.trim(),
    },
  });
  if (!result.ok) return result;
  revalidatePath(OPS_EMAIL_PATH);
  return { ok: true };
}

const folderSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export async function createOpsEmailLabelAction(
  name: string,
  color: string,
): Promise<{ ok: true; labelId: string } | { ok: false; error: string }> {
  const actor = await requireOpsActor();
  if (!actor.ok) return actor;
  const parsed = folderSchema.safeParse({ name, color });
  if (!parsed.success) return { ok: false, error: "Invalid folder." };
  const result = await createOpsEmailLabel({
    ownerAuthUserId: actor.userId,
    name: parsed.data.name,
    color: parsed.data.color,
  });
  if (!result.ok) return result;
  revalidatePath(OPS_EMAIL_PATH);
  return result;
}
