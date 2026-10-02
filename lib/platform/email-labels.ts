import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";

export type OpsEmailLabel = {
  id: string;
  name: string;
  color: string;
  threadCount: number;
};

export async function listOpsEmailLabels(
  ownerAuthUserId: string,
): Promise<{ ok: true; labels: OpsEmailLabel[] } | { ok: false; error: string; labels: [] }> {
  const client = createPlatformClient();
  const { data: labels, error } = await client
    .from("platform_email_labels")
    .select("id, name, color, position")
    .eq("owner_auth_user_id", ownerAuthUserId)
    .order("position", { ascending: true });

  if (error) {
    const missing = error.message.includes("platform_email_labels");
    return {
      ok: false,
      error: missing
        ? "Custom folders require migration 20261002120000_platform_ops_mailbox.sql."
        : error.message,
      labels: [],
    };
  }

  const ids = (labels ?? []).map((row) => row.id as string);
  const counts = new Map<string, number>();

  if (ids.length > 0) {
    const { data: rows } = await client
      .from("platform_outbound_emails")
      .select("label_id")
      .eq("actor_user_id", ownerAuthUserId)
      .in("label_id", ids);

    for (const row of rows ?? []) {
      const lid = row.label_id as string | null;
      if (lid) counts.set(lid, (counts.get(lid) ?? 0) + 1);
    }
  }

  return {
    ok: true,
    labels: (labels ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      color: row.color as string,
      threadCount: counts.get(row.id as string) ?? 0,
    })),
  };
}

export async function createOpsEmailLabel(input: {
  ownerAuthUserId: string;
  name: string;
  color: string;
}): Promise<{ ok: true; labelId: string } | { ok: false; error: string }> {
  const client = createPlatformClient();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Folder name is required." };

  const { data: maxRow } = await client
    .from("platform_email_labels")
    .select("position")
    .eq("owner_auth_user_id", input.ownerAuthUserId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = ((maxRow?.position as number | undefined) ?? -1) + 1;

  const { data, error } = await client
    .from("platform_email_labels")
    .insert({
      owner_auth_user_id: input.ownerAuthUserId,
      name,
      color: input.color,
      position,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, labelId: data.id as string };
}
