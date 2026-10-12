import type { OpsMailboxMessage } from "@/lib/ops-email/mailbox-message";

const FAVORITES_KEY = "weeon-ops-email-favorites";
const TRASH_KEY = "weeon-ops-email-trash";

export function mailboxMessageKey(row: OpsMailboxMessage): string {
  return `${row.kind}:${row.id}`;
}

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed.filter((item) => typeof item === "string"));
  } catch {
    return new Set();
  }
}

function writeSet(key: string, values: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...values]));
}

export function loadFavoriteKeys(): Set<string> {
  return readSet(FAVORITES_KEY);
}

export function loadTrashKeys(): Set<string> {
  return readSet(TRASH_KEY);
}

export function persistFavoriteKeys(values: Set<string>) {
  writeSet(FAVORITES_KEY, values);
}

export function persistTrashKeys(values: Set<string>) {
  writeSet(TRASH_KEY, values);
}
