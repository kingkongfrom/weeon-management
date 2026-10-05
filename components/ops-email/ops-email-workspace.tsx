"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Folder,
  Inbox,
  Mail,
  Menu,
  PenSquare,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Settings,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ACTION_NAV_LINK } from "@/lib/ui/action-button";
import { useT } from "@/lib/i18n/client";
import { opsEmailTone } from "@/lib/ops-email/messages-tone";
import type { OpsEmailFolder } from "@/lib/ops-email/folders";
import { OpsEmailReadingPane } from "@/components/ops-email/ops-email-reading-pane";
import { OpsUnreadCountBadge } from "@/components/ops-email/ops-unread-count-badge";
import { OpsEmailAutoReplyDialog } from "@/components/ops-email/ops-email-auto-reply-dialog";
import { OpsEmailNewFolderDialog } from "@/components/ops-email/ops-email-new-folder-dialog";
import type { OpsEmailLabel } from "@/lib/platform/email-labels";
import type { OpsMailboxSettings } from "@/lib/platform/ops-mailbox-settings";
import { markOpsInboundReadAction } from "@/lib/dashboard/ops-inbound-email-actions";
import type { InboundEmailRow } from "@/lib/platform/inbound-email";
import type { OutboundEmailRow } from "@/lib/platform/outbound-email";
import {
  inboundToMailbox,
  mailboxIsUnread,
  mailboxListTitle,
  mailboxPreviewText,
  outboundToMailbox,
  type OpsMailboxMessage,
} from "@/lib/ops-email/mailbox-message";

const OPS_EMAIL = "/dashboard/email";
const OPS_EMAIL_SETTINGS = "/dashboard/email/configuracion";
const OPS_COMPOSE = "/dashboard/email/nuevo";

function formatListTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function preview(body: string): string {
  const line = body.replace(/\s+/g, " ").trim();
  return line.length > 120 ? `${line.slice(0, 117)}…` : line;
}

function avatarColor(name: string): string {
  const colors = ["bg-[#0f766e]", "bg-[#2563b0]", "bg-[#7c3aed]", "bg-[#d97706]", "bg-[#e11d48]"];
  let hash = 0;
  for (const char of name) hash += char.charCodeAt(0);
  return colors[hash % colors.length] ?? colors[0];
}

type OpsEmailWorkspaceProps = {
  folder: OpsEmailFolder;
  labelId: string | null;
  rows: OutboundEmailRow[];
  inboundRows: InboundEmailRow[];
  inboundUnreadCount: number;
  labels: OpsEmailLabel[];
  mailboxSettings: OpsMailboxSettings;
  listWarning: string | null;
  labelsWarning: string | null;
};

export function OpsEmailWorkspace({
  folder,
  labelId,
  rows,
  inboundRows,
  inboundUnreadCount,
  labels,
  mailboxSettings,
  listWarning,
  labelsWarning,
}: OpsEmailWorkspaceProps) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [failedOnly, setFailedOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [autoReplyOpen, setAutoReplyOpen] = useState(false);
  const [localMailboxSettings, setLocalMailboxSettings] = useState(mailboxSettings);
  const [localLabels, setLocalLabels] = useState(labels);

  useEffect(() => {
    setLocalMailboxSettings(mailboxSettings);
  }, [mailboxSettings]);

  useEffect(() => {
    setLocalLabels(labels);
  }, [labels]);

  const failedCount = rows.filter((row) => row.status === "failed").length;

  const listMessages: OpsMailboxMessage[] = useMemo(() => {
    if (folder === "inbox") return inboundRows.map(inboundToMailbox);
    if (folder === "sent") return rows.map(outboundToMailbox);
    return [];
  }, [folder, inboundRows, rows]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return listMessages
      .filter((row) => {
        if (folder === "sent" && failedOnly) {
          return row.kind === "outbound" && row.status === "failed";
        }
        if (folder === "inbox" && failedOnly) {
          return mailboxIsUnread(row);
        }
        return true;
      })
      .filter((row) => {
        if (!term) return true;
        const title = mailboxListTitle(row).toLowerCase();
        const body = mailboxPreviewText(row).toLowerCase();
        const subject = row.subject.toLowerCase();
        if (row.kind === "outbound") {
          return (
            subject.includes(term) ||
            title.includes(term) ||
            body.includes(term) ||
            row.actorEmail.toLowerCase().includes(term)
          );
        }
        return subject.includes(term) || title.includes(term) || body.includes(term);
      });
  }, [listMessages, query, failedOnly, folder]);

  const openRow =
    filtered.find((row) => row.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (!openRow || openRow.kind !== "inbound" || openRow.readAt) return;
    void markOpsInboundReadAction(openRow.id);
  }, [openRow]);

  const folders: Array<{
    id: OpsEmailFolder | "drafts";
    label: string;
    icon: typeof Inbox;
    href: string;
    inboxBadge?: number;
  }> = [
    {
      id: "inbox",
      label: t.opsEmail.folderInbox,
      icon: Inbox,
      href: `${OPS_EMAIL}?folder=inbox`,
      inboxBadge: inboundUnreadCount,
    },
    {
      id: "sent",
      label: t.opsEmail.folderSent,
      icon: Send,
      href: OPS_EMAIL,
      inboxBadge: failedCount,
    },
    {
      id: "favorite",
      label: t.opsEmail.folderFavorites,
      icon: Star,
      href: `${OPS_EMAIL}?folder=favorite`,
    },
    {
      id: "drafts",
      label: t.opsEmail.folderDrafts,
      icon: Mail,
      href: `${OPS_EMAIL}?folder=drafts`,
    },
    {
      id: "trash",
      label: t.opsEmail.folderTrash,
      icon: Trash2,
      href: `${OPS_EMAIL}?folder=trash`,
    },
  ];

  function emptyCopy(): { title: string; body: string } {
    if (folder === "inbox") {
      return { title: t.opsEmail.emptyInbox, body: t.opsEmail.emptyInboxBody };
    }
    if (folder === "favorite") {
      return { title: t.opsEmail.emptyFavorites, body: t.opsEmail.emptyFavoritesBody };
    }
    if (folder === "draft") {
      return { title: t.opsEmail.emptyDrafts, body: t.opsEmail.emptyDraftsBody };
    }
    if (folder === "trash") {
      return { title: t.opsEmail.emptyTrash, body: t.opsEmail.emptyTrashBody };
    }
    return { title: t.opsEmail.emptyMessages, body: t.opsEmail.emptyMessagesBody };
  }

  const empty = emptyCopy();

  return (
    <div className="relative flex w-full flex-col gap-3">
      {listWarning ? (
        <p className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
          {listWarning}
        </p>
      ) : null}
      {labelsWarning ? (
        <p className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
          {labelsWarning}
        </p>
      ) : null}

      <div className="flex items-center">
        <div className="flex w-56 shrink-0 items-center gap-2 px-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl lg:hidden",
              opsEmailTone.primaryButton,
            )}
            aria-label={t.shell.expandMenu}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href={OPS_COMPOSE}
            className="inline-flex h-10 w-full items-center gap-2.5 rounded-xl bg-[#0891B2] px-3 text-sm font-semibold text-white hover:bg-[#0e7490]"
          >
            <PenSquare className="h-4 w-4" />
            {t.opsEmail.composeMessage}
          </Link>
        </div>
        <div className="flex w-[22rem] shrink-0 items-center max-lg:hidden">
          <div className="relative w-[80%] shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.opsEmail.searchMessages}
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div className="ml-2 flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setFailedOnly((current) => !current)}
              aria-pressed={failedOnly}
              disabled={folder !== "sent" && folder !== "inbox"}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold disabled:opacity-40",
                failedOnly ? opsEmailTone.unreadFilterActive : "border-border text-foreground/70",
              )}
            >
              <Mail className="h-4 w-4" />
              {folder === "sent"
                ? t.opsEmail.failedOnly
                : folder === "inbox"
                  ? t.opsEmail.unreadOnly
                  : t.opsEmail.unreadOnly}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground/60"
              aria-label="Print"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={refreshing}
              onClick={() => {
                setRefreshing(true);
                router.refresh();
                window.setTimeout(() => setRefreshing(false), 800);
              }}
              title={t.opsEmail.refreshList}
              aria-label={t.opsEmail.refreshList}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground/60 disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.opsEmail.searchMessages}
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand-400"
          />
        </div>
      </div>

      <div className="flex h-[calc(100dvh-8rem)] min-h-[28rem] w-full overflow-x-auto rounded-2xl border border-border bg-surface">
        <aside
          className={cn(
            "flex w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border px-2 py-3",
            !sidebarOpen && "hidden lg:flex",
          )}
        >
          <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-foreground/40">
            {t.opsEmail.messagesTitle}
          </p>
          {folders.map((item) => {
            const Icon = item.icon;
            const folderKey = item.id === "drafts" ? "draft" : item.id;
            const active = !labelId && folder === folderKey;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  ACTION_NAV_LINK,
                  active
                    ? "bg-[#0891B2] text-white"
                    : "text-foreground/70 hover:bg-surface-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.id === "inbox" || item.id === "sent" ? (
                  <OpsUnreadCountBadge count={item.inboxBadge ?? 0} />
                ) : null}
              </Link>
            );
          })}

          <div className="my-2 border-t border-border" />

          <button
            type="button"
            onClick={() => setFoldersExpanded((current) => !current)}
            className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-foreground/70 hover:bg-surface-muted/60"
          >
            {foldersExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Folder className="h-4 w-4" />
            <span className="flex-1 text-left">{t.opsEmail.foldersSection}</span>
          </button>

          {foldersExpanded ? (
            <div className="ml-2 flex flex-col gap-0.5 border-l border-border pl-2">
              {localLabels.map((label) => {
                const active = labelId === label.id;
                return (
                  <Link
                    key={label.id}
                    href={`${OPS_EMAIL}?label=${label.id}`}
                    className={cn(
                      "inline-flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold transition-colors",
                      active ? opsEmailTone.activeLabelNav : "text-foreground/70 hover:bg-surface-muted/60",
                    )}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="min-w-0 flex-1 truncate">{label.name}</span>
                    <span className="text-xs font-medium text-foreground/40">
                      ({label.threadCount})
                    </span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setNewFolderOpen(true)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold",
                  opsEmailTone.linkHover,
                )}
              >
                <Plus className="h-4 w-4" />
                {t.opsEmail.newFolder}
              </button>
            </div>
          ) : null}

          <div className="my-2 border-t border-border" />

          <button
            type="button"
            onClick={() => setSettingsExpanded((current) => !current)}
            className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-foreground/70 hover:bg-surface-muted/60"
          >
            {settingsExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Settings className="h-4 w-4" />
            <span className="flex-1 text-left">{t.opsEmail.settingsSection}</span>
          </button>

          {settingsExpanded ? (
            <div className="ml-2 flex flex-col gap-0.5 border-l border-border pl-2">
              <Link
                href={OPS_EMAIL_SETTINGS}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:bg-surface-muted/60 hover:text-foreground"
              >
                <PenSquare className="h-4 w-4" />
                <span className="flex-1 text-left">{t.opsEmail.mailboxSignatureLink}</span>
              </Link>
              <button
                type="button"
                onClick={() => setAutoReplyOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:bg-surface-muted/60 hover:text-foreground"
              >
                <CalendarClock className="h-4 w-4" />
                <span className="flex-1 text-left">{t.opsEmail.autoReplyTitle}</span>
                {localMailboxSettings.autoReplyEnabled ? (
                  <span className={cn("h-2 w-2 rounded-full", opsEmailTone.unreadDot)} />
                ) : null}
              </button>
            </div>
          ) : null}
        </aside>

        <section className="flex w-[22rem] shrink-0 flex-col overflow-y-auto border-r border-border">
          {folder === "sent" && failedCount > 0 && !failedOnly ? (
            <div className="border-b border-border px-4 py-3">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", opsEmailTone.accentMuted)}>
                {failedCount} failed
              </span>
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-semibold text-foreground">{empty.title}</p>
              <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-foreground/50">
                {empty.body}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((row) => {
                const active = openRow?.id === row.id;
                const counterpart = mailboxListTitle(row);
                const showDot = mailboxIsUnread(row);
                return (
                  <li key={row.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(row.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(row.id);
                        }
                      }}
                      className={cn(
                        "flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-muted/35",
                        active && opsEmailTone.selectedRow,
                      )}
                    >
                      <span
                        className={cn(
                          "mt-2 h-2.5 w-2.5 shrink-0 rounded-full",
                          showDot ? opsEmailTone.unreadDot : "bg-transparent",
                        )}
                      />
                      <span
                        className={cn(
                          "mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                          avatarColor(counterpart),
                        )}
                      >
                        {counterpart.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="truncate text-sm font-semibold text-foreground/85">
                          {counterpart}
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-medium text-foreground/80">
                          {row.subject}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-foreground/45">
                          {preview(mailboxPreviewText(row))}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-foreground/45">
                        {formatListTime(row.createdAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <OpsEmailReadingPane message={openRow} />
      </div>

      <OpsEmailNewFolderDialog
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onCreated={() => router.refresh()}
      />
      <OpsEmailAutoReplyDialog
        open={autoReplyOpen}
        settings={localMailboxSettings}
        onClose={() => setAutoReplyOpen(false)}
        onSaved={setLocalMailboxSettings}
      />
    </div>
  );
}
