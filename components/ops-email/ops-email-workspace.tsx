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
import {
  loadFavoriteKeys,
  loadTrashKeys,
  mailboxMessageKey,
  persistFavoriteKeys,
  persistTrashKeys,
} from "@/lib/ops-email/mailbox-local-state";
import {
  listOpsComposeDrafts,
  opsComposeDraftPreview,
  OPS_DRAFTS_EVENT,
  type OpsComposeDraft,
} from "@/lib/ops-email/compose-drafts";

const OPS_EMAIL = "/dashboard/email";
const OPS_EMAIL_SETTINGS = "/dashboard/email/configuracion";
const OPS_COMPOSE = "/dashboard/email/nuevo";

function opsComposeHref(row: OpsMailboxMessage): string {
  if (row.kind === "inbound") {
    return `${OPS_COMPOSE}?reply=${encodeURIComponent(row.id)}`;
  }
  return `${OPS_COMPOSE}?replySent=${encodeURIComponent(row.id)}`;
}

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
  viewerEmail?: string;
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
  viewerEmail = "",
}: OpsEmailWorkspaceProps) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [composeDrafts, setComposeDrafts] = useState<OpsComposeDraft[]>([]);
  const [failedOnly, setFailedOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileFoldersOpen, setMobileFoldersOpen] = useState(false);
  /** Phone: the reading pane replaces the list; back returns to the list. */
  const [readingOpen, setReadingOpen] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [autoReplyOpen, setAutoReplyOpen] = useState(false);
  const [localMailboxSettings, setLocalMailboxSettings] = useState(mailboxSettings);
  const [localLabels, setLocalLabels] = useState(labels);
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(() => new Set());
  const [trashKeys, setTrashKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setFavoriteKeys(loadFavoriteKeys());
    setTrashKeys(loadTrashKeys());
  }, []);

  useEffect(() => {
    setLocalMailboxSettings(mailboxSettings);
  }, [mailboxSettings]);

  useEffect(() => {
    setLocalLabels(labels);
  }, [labels]);

  useEffect(() => {
    const refresh = () => setComposeDrafts(listOpsComposeDrafts());
    refresh();
    window.addEventListener(OPS_DRAFTS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(OPS_DRAFTS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const failedCount = rows.filter((row) => row.status === "failed").length;

  const allMessages: OpsMailboxMessage[] = useMemo(() => {
    const inbound = inboundRows.map(inboundToMailbox);
    const outbound = rows.map(outboundToMailbox);
    return [...inbound, ...outbound].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [inboundRows, rows]);

  const listMessages: OpsMailboxMessage[] = useMemo(() => {
    if (folder === "inbox") {
      return inboundRows
        .map(inboundToMailbox)
        .filter((row) => !trashKeys.has(mailboxMessageKey(row)));
    }
    if (folder === "sent") {
      return rows
        .map(outboundToMailbox)
        .filter((row) => !trashKeys.has(mailboxMessageKey(row)));
    }
    if (folder === "favorite") {
      return allMessages.filter((row) => favoriteKeys.has(mailboxMessageKey(row)));
    }
    if (folder === "trash") {
      return allMessages.filter((row) => trashKeys.has(mailboxMessageKey(row)));
    }
    return [];
  }, [folder, inboundRows, rows, allMessages, favoriteKeys, trashKeys]);

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

  const openRowKey = openRow ? mailboxMessageKey(openRow) : null;

  function toggleFavoriteForOpen() {
    if (!openRowKey) return;
    setFavoriteKeys((current) => {
      const next = new Set(current);
      if (next.has(openRowKey)) next.delete(openRowKey);
      else next.add(openRowKey);
      persistFavoriteKeys(next);
      return next;
    });
  }

  function moveOpenToTrash() {
    if (!openRowKey) return;
    setTrashKeys((current) => {
      const next = new Set(current);
      next.add(openRowKey);
      persistTrashKeys(next);
      return next;
    });
    setFavoriteKeys((current) => {
      if (!current.has(openRowKey)) return current;
      const next = new Set(current);
      next.delete(openRowKey);
      persistFavoriteKeys(next);
      return next;
    });
  }

  useEffect(() => {
    if (!openRow || openRow.kind !== "inbound" || openRow.readAt) return;
    void markOpsInboundReadAction(openRow.id);
  }, [openRow]);

  useEffect(() => {
    if (!mobileFoldersOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFoldersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileFoldersOpen]);

  function openMessage(id: string) {
    setSelectedId(id);
    setReadingOpen(true);
  }

  function selectFolder() {
    setMobileFoldersOpen(false);
  }

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
  const draftQuery = query.trim().toLowerCase();
  const visibleDrafts = composeDrafts.filter((draft) => {
    if (!draftQuery) return true;
    const haystack = [draft.subject, draft.to.join(" "), draft.cc.join(" "), opsComposeDraftPreview(draft)]
      .join(" ")
      .toLowerCase();
    return haystack.includes(draftQuery);
  });

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

      {/* Toolbar: one row on every size — folders, compose, search, filter. */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobileFoldersOpen(true)}
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground/65 lg:hidden",
          )}
          aria-label={t.opsEmail.navFolders}
          aria-haspopup="dialog"
          aria-expanded={mobileFoldersOpen}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setSidebarOpen((current) => !current)}
          className={cn(
            "hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl lg:inline-flex",
            opsEmailTone.primaryButton,
          )}
          aria-label={t.shell.expandMenu}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder={t.opsEmail.searchMessages}
            aria-label={t.opsEmail.searchMessages}
            className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-base outline-none focus:border-brand-400 sm:h-10 lg:text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => setFailedOnly((current) => !current)}
          aria-pressed={failedOnly}
          disabled={folder !== "sent" && folder !== "inbox"}
          aria-label={folder === "sent" ? t.opsEmail.failedOnly : t.opsEmail.unreadOnly}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold disabled:opacity-40 sm:h-10 sm:px-3 sm:text-sm",
            failedOnly ? opsEmailTone.unreadFilterActive : "border-border text-foreground/70",
          )}
        >
          <Mail className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">
            {folder === "sent" ? t.opsEmail.failedOnly : t.opsEmail.unreadOnly}
          </span>
        </button>

        <button
          type="button"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true);
            router.refresh();
            window.setTimeout(() => setRefreshing(false), 800);
          }}
          aria-label={t.opsEmail.refreshList}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground/60 disabled:opacity-60 sm:h-10 sm:w-10"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden />
        </button>

        <Link
          href={OPS_COMPOSE}
          aria-label={t.opsEmail.composeMessage}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#0891B2] px-3 text-sm font-semibold text-white hover:bg-[#0e7490] sm:h-10"
        >
          <PenSquare className="h-4 w-4" aria-hidden />
          <span className="hidden md:inline">{t.opsEmail.composeMessage}</span>
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          aria-label={t.opsEmail.printList}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-foreground/60 xl:inline-flex"
        >
          <Printer className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex h-[calc(100dvh-10.5rem)] min-h-[28rem] w-full overflow-hidden rounded-2xl border border-border bg-surface lg:h-[calc(100dvh-8rem)]">
        <aside
          className={cn(
            "flex w-56 shrink-0 flex-col gap-1 overflow-y-auto overscroll-contain border-r border-border px-2 py-3 [-webkit-overflow-scrolling:touch]",
            !sidebarOpen && "hidden",
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
                onClick={selectFolder}
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
                    onClick={selectFolder}
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
                onClick={selectFolder}
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

        <section
          className={cn(
            "flex min-w-0 flex-col overflow-y-auto overscroll-contain border-r border-border [-webkit-overflow-scrolling:touch]",
            "w-full flex-1 basis-full lg:w-[35%] lg:max-w-[35%] lg:flex-none lg:basis-[35%]",
            readingOpen && "hidden lg:flex",
          )}
        >
          {folder === "sent" && failedCount > 0 && !failedOnly ? (
            <div className="border-b border-border px-4 py-3">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", opsEmailTone.accentMuted)}>
                {failedCount} failed
              </span>
            </div>
          ) : null}

          {folder === "draft" ? (
            visibleDrafts.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-semibold text-foreground">{empty.title}</p>
                <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-foreground/50">
                  {empty.body}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {visibleDrafts.map((draft) => {
                  const title = draft.to[0] || draft.subject.trim() || t.opsEmail.draftNoSubject;
                  const subject = draft.subject.trim() || t.opsEmail.draftNoSubject;
                  return (
                    <li key={draft.id}>
                      <button
                        type="button"
                        onClick={() => router.push(`${OPS_COMPOSE}?draft=${draft.id}`)}
                        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-muted/35"
                      >
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-transparent" />
                        <span
                          className={cn(
                            "mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                            avatarColor(title),
                          )}
                        >
                          {title.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="truncate text-sm font-semibold text-foreground/85">
                            {title}
                          </span>
                          <span className="mt-0.5 block truncate text-sm font-medium text-foreground/80">
                            {subject}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-foreground/45">
                            {preview(opsComposeDraftPreview(draft))}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-foreground/45">
                          {formatListTime(draft.updatedAt)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          ) : filtered.length === 0 ? (
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
                      onClick={() => openMessage(row.id)}
                      onDoubleClick={() => router.push(opsComposeHref(row))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(row.id);
                        }
                      }}
                      className={cn(
                        "flex min-h-[4.25rem] w-full cursor-pointer items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-surface-muted/35 active:bg-surface-muted/50 sm:px-4 sm:py-3.5",
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

        <div
          className={cn(
            "min-w-0 flex-1 flex-col overflow-hidden lg:flex lg:w-[65%] lg:max-w-[65%] lg:flex-none lg:basis-[65%]",
            readingOpen ? "flex" : "hidden",
          )}
        >
          <OpsEmailReadingPane
            message={openRow}
            folder={folder}
            viewerEmail={viewerEmail}
            isFavorite={openRowKey ? favoriteKeys.has(openRowKey) : false}
            onToggleFavorite={toggleFavoriteForOpen}
            onMoveToTrash={moveOpenToTrash}
            onBack={() => setReadingOpen(false)}
          />
        </div>
      </div>

      {/* Phone: folders and settings, same destinations as the desktop rail. */}
      {mobileFoldersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.opsEmail.messagesTitle}>
          <button
            type="button"
            aria-label={t.opsEmail.backToList}
            onClick={() => setMobileFoldersOpen(false)}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
          />
          <div
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-border bg-surface shadow-elevated"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
              <p className="text-base font-bold text-foreground">{t.opsEmail.messagesTitle}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setNewFolderOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#0891B2]"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {t.opsEmail.newFolder}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFoldersOpen(false)}
                  aria-label={t.opsEmail.backToList}
                  className="grid h-9 w-9 place-items-center rounded-lg text-foreground/50 active:bg-surface-muted"
                >
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 [-webkit-overflow-scrolling:touch]">
              <ul>
                {folders.map((item) => {
                  const Icon = item.icon;
                  const folderKey = item.id === "drafts" ? "draft" : item.id;
                  const active = !labelId && folder === folderKey;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={selectFolder}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold ${
                          active
                            ? "bg-[#0891B2]/10 text-[#0e7490] dark:text-[#67e8f9]"
                            : "text-foreground/80 active:bg-surface-muted"
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0 text-foreground/50" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.id === "inbox" || item.id === "sent" ? (
                          <OpsUnreadCountBadge count={item.inboxBadge ?? 0} />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                {t.opsEmail.foldersSection}
              </p>
              <ul>
                {localLabels.map((label) => (
                  <li key={label.id}>
                    <Link
                      href={`${OPS_EMAIL}?label=${label.id}`}
                      onClick={selectFolder}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-semibold text-foreground/80 active:bg-surface-muted"
                    >
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: label.color }} />
                      <span className="min-w-0 flex-1 truncate">{label.name}</span>
                      <span className="text-xs font-medium text-foreground/40">{label.threadCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                {t.opsEmail.settingsSection}
              </p>
              <ul>
                <li>
                  <Link
                    href={OPS_EMAIL_SETTINGS}
                    onClick={selectFolder}
                    className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-semibold text-foreground/80 active:bg-surface-muted"
                  >
                    <PenSquare className="h-5 w-5 text-foreground/50" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{t.opsEmail.mailboxSignatureLink}</span>
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileFoldersOpen(false);
                      setAutoReplyOpen(true);
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] font-semibold text-foreground/80 active:bg-surface-muted"
                  >
                    <CalendarClock className="h-5 w-5 text-foreground/50" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{t.opsEmail.autoReplyTitle}</span>
                    {localMailboxSettings.autoReplyEnabled ? (
                      <span className={cn("h-2 w-2 rounded-full", opsEmailTone.unreadDot)} aria-hidden />
                    ) : null}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}

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
