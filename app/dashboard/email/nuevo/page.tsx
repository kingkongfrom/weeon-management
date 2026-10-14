import type { Metadata } from "next";
import { OpsEmailComposeClient } from "@/components/dashboard/ops-email-compose-client";
import { getPlatformSession } from "@/lib/auth/session";
import { listOpsFromAddressOptions } from "@/lib/email/ops-from-addresses";
import { getInboundEmailById } from "@/lib/platform/inbound-email";
import { getOutboundEmailById } from "@/lib/platform/outbound-email";
import {
  inboundForwardComposeInitial,
  inboundReplyAllComposeInitial,
  inboundReplyComposeInitial,
  outboundReplyComposeInitial,
} from "@/lib/ops-email/reply-compose";

export const metadata: Metadata = {
  title: "Compose email",
};

export const dynamic = "force-dynamic";

export default async function OpsEmailComposePage({
  searchParams,
}: {
  searchParams: Promise<{ reply?: string; replySent?: string; forward?: string; mode?: string; draft?: string }>;
}) {
  const { sessionUser } = await getPlatformSession();
  const actorEmail = sessionUser?.email?.trim() ?? "";
  const fromOptions = listOpsFromAddressOptions(actorEmail).map((row) => ({
    key: row.key,
    label: row.label,
  }));
  const defaultFromKey = fromOptions[0]?.key ?? "";

  const { reply: replyId, replySent: replySentId, forward: forwardId, mode, draft } =
    await searchParams;
  let replyInitial = null;
  let replyAllSeed = null;
  const expandReplyAll = mode === "replyAll";

  if (forwardId) {
    const loaded = await getInboundEmailById(forwardId);
    if (loaded.ok) {
      replyInitial = inboundForwardComposeInitial(loaded.row);
    }
  } else if (replyId) {
    const loaded = await getInboundEmailById(replyId);
    if (loaded.ok) {
      replyInitial = inboundReplyComposeInitial(loaded.row);
      replyAllSeed = inboundReplyAllComposeInitial(loaded.row);
    }
  } else if (replySentId) {
    const loaded = await getOutboundEmailById(replySentId);
    if (loaded.ok) {
      replyInitial = outboundReplyComposeInitial(loaded.row);
    }
  }

  return (
    <OpsEmailComposeClient
      initial={replyInitial}
      replyAllSeed={replyAllSeed}
      expandReplyAll={expandReplyAll}
      fromOptions={fromOptions}
      defaultFromKey={defaultFromKey}
      draftId={draft && /^[0-9a-f-]{36}$/i.test(draft) ? draft : null}
    />
  );
}
