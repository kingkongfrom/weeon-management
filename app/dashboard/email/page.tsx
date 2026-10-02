import type { Metadata } from "next";
import { Suspense } from "react";
import { OpsEmailWorkspace } from "@/components/ops-email/ops-email-workspace";
import { Skeleton } from "@/components/dashboard/skeleton";
import { getPlatformSession } from "@/lib/auth/session";
import { listOpsEmailLabels } from "@/lib/platform/email-labels";
import { loadOpsMailboxSettings } from "@/lib/platform/ops-mailbox-settings";
import { listInboundEmails } from "@/lib/platform/inbound-email";
import { listOutboundEmails } from "@/lib/platform/outbound-email";
import {
  parseOpsEmailFolder,
  parseOpsEmailLabelId,
} from "@/lib/ops-email/folders";

export const metadata: Metadata = {
  title: "Email",
};

export const dynamic = "force-dynamic";

async function EmailContent({
  folderParam,
  labelParam,
}: {
  folderParam?: string;
  labelParam?: string;
}) {
  const labelId = parseOpsEmailLabelId(labelParam);
  const folder = labelId ? "sent" : parseOpsEmailFolder(folderParam);

  const { user } = await getPlatformSession();
  const userId = user?.id ?? "";

  const [list, inboundList, labelsResult, mailboxSettings] = await Promise.all([
    listOutboundEmails(40, labelId),
    listInboundEmails(40),
    userId ? listOpsEmailLabels(userId) : Promise.resolve({ ok: true as const, labels: [] }),
    userId ? loadOpsMailboxSettings(userId) : Promise.resolve(null),
  ]);

  const listWarnings = [list.ok ? null : list.reason, inboundList.ok ? null : inboundList.reason]
    .filter(Boolean)
    .join(" ");

  return (
    <OpsEmailWorkspace
      folder={folder}
      labelId={labelId}
      rows={list.rows}
      inboundRows={inboundList.rows}
      inboundUnreadCount={inboundList.unreadCount}
      labels={labelsResult.labels}
      mailboxSettings={
        mailboxSettings ?? {
          signatureText: "",
          autoReplyEnabled: false,
          autoReplyStart: null,
          autoReplyEnd: null,
          autoReplyText: "",
        }
      }
      listWarning={listWarnings || null}
      labelsWarning={labelsResult.ok ? null : labelsResult.error}
    />
  );
}

function EmailSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-10 w-full max-w-md rounded-xl" />
      <Skeleton className="h-[calc(100dvh-8rem)] min-h-[28rem] w-full rounded-2xl" />
    </div>
  );
}

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; label?: string }>;
}) {
  const { folder, label } = await searchParams;

  return (
    <Suspense fallback={<EmailSkeleton />}>
      <EmailContent folderParam={folder} labelParam={label} />
    </Suspense>
  );
}
