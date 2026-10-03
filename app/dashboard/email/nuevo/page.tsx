import type { Metadata } from "next";
import { OpsEmailCompose } from "@/components/ops-email/ops-email-compose";
import { getPlatformSession } from "@/lib/auth/session";
import { listOpsFromAddressOptions } from "@/lib/email/ops-from-addresses";
import { getInboundEmailById } from "@/lib/platform/inbound-email";
import { getOutboundEmailById } from "@/lib/platform/outbound-email";
import {
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
  searchParams: Promise<{ reply?: string; replySent?: string }>;
}) {
  const { sessionUser } = await getPlatformSession();
  const actorEmail = sessionUser?.email?.trim() ?? "";
  const fromOptions = listOpsFromAddressOptions(actorEmail).map((row) => ({
    key: row.key,
    label: row.label,
  }));
  const defaultFromKey = fromOptions[0]?.key ?? "";

  const { reply: replyId, replySent: replySentId } = await searchParams;
  let replyInitial = null;

  if (replyId) {
    const loaded = await getInboundEmailById(replyId);
    if (loaded.ok) {
      replyInitial = inboundReplyComposeInitial(loaded.row);
    }
  } else if (replySentId) {
    const loaded = await getOutboundEmailById(replySentId);
    if (loaded.ok) {
      replyInitial = outboundReplyComposeInitial(loaded.row);
    }
  }

  return (
    <OpsEmailCompose
      initial={replyInitial}
      fromOptions={fromOptions}
      defaultFromKey={defaultFromKey}
    />
  );
}
