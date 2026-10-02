import type { Metadata } from "next";
import { OpsEmailCompose } from "@/components/ops-email/ops-email-compose";
import { getInboundEmailById } from "@/lib/platform/inbound-email";
import { inboundReplyComposeInitial } from "@/lib/ops-email/reply-compose";

export const metadata: Metadata = {
  title: "Compose email",
};

export const dynamic = "force-dynamic";

export default async function OpsEmailComposePage({
  searchParams,
}: {
  searchParams: Promise<{ reply?: string }>;
}) {
  const { reply: replyId } = await searchParams;
  let replyInitial = null;

  if (replyId) {
    const loaded = await getInboundEmailById(replyId);
    if (loaded.ok) {
      replyInitial = inboundReplyComposeInitial(loaded.row);
    }
  }

  return <OpsEmailCompose initial={replyInitial} />;
}
