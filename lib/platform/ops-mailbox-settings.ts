import "server-only";

import { cache } from "react";
import { createPlatformClient } from "@/lib/supabase/platform";

export type OpsMailboxSettings = {
  signatureText: string;
  autoReplyEnabled: boolean;
  autoReplyStart: string | null;
  autoReplyEnd: string | null;
  autoReplyText: string;
};

export const emptyOpsMailboxSettings = (): OpsMailboxSettings => ({
  signatureText: "",
  autoReplyEnabled: false,
  autoReplyStart: null,
  autoReplyEnd: null,
  autoReplyText: "",
});

export const loadOpsMailboxSettings = cache(
  async (ownerAuthUserId: string): Promise<OpsMailboxSettings> => {
    const client = createPlatformClient();
    const { data, error } = await client
      .from("platform_ops_mailbox_settings")
      .select(
        "signature_text, auto_reply_enabled, auto_reply_start, auto_reply_end, auto_reply_text",
      )
      .eq("owner_auth_user_id", ownerAuthUserId)
      .maybeSingle();

    if (error || !data) return emptyOpsMailboxSettings();

    const row = data as {
      signature_text: string | null;
      auto_reply_enabled: boolean;
      auto_reply_start: string | null;
      auto_reply_end: string | null;
      auto_reply_text: string | null;
    };

    return {
      signatureText: row.signature_text?.trim() ?? "",
      autoReplyEnabled: row.auto_reply_enabled,
      autoReplyStart: row.auto_reply_start,
      autoReplyEnd: row.auto_reply_end,
      autoReplyText: row.auto_reply_text?.trim() ?? "",
    };
  },
);

export async function saveOpsMailboxSettings(input: {
  ownerAuthUserId: string;
  ownerEmail: string;
  patch: Partial<OpsMailboxSettings>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = createPlatformClient();
  const current = await loadOpsMailboxSettings(input.ownerAuthUserId);
  const next = { ...current, ...input.patch };

  const { error } = await client.from("platform_ops_mailbox_settings").upsert(
    {
      owner_auth_user_id: input.ownerAuthUserId,
      owner_email: input.ownerEmail,
      signature_text: next.signatureText || null,
      auto_reply_enabled: next.autoReplyEnabled,
      auto_reply_start: next.autoReplyStart,
      auto_reply_end: next.autoReplyEnd,
      auto_reply_text: next.autoReplyText || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_auth_user_id" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
