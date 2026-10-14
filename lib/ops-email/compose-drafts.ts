import { docHasContent, docToPlainText, emptyDoc, type RichTextDoc } from "@/lib/comms/model";

const DRAFTS_KEY = "weeon-ops-email-compose-drafts";
const LEGACY_DRAFT_KEY = "weeon-ops-email-compose-draft";

export const OPS_DRAFTS_EVENT = "weeon-ops-drafts-changed";

export type OpsComposeDraft = {
  id: string;
  to: string[];
  cc: string[];
  subject: string;
  body: RichTextDoc;
  allowReplies: boolean;
  fromKey: string;
  updatedAt: string;
};

function hasContent(draft: Pick<OpsComposeDraft, "to" | "cc" | "subject" | "body">): boolean {
  return (
    draft.subject.trim().length > 0 ||
    draft.to.length > 0 ||
    draft.cc.length > 0 ||
    docHasContent(draft.body)
  );
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPS_DRAFTS_EVENT));
}

function readRaw(): OpsComposeDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OpsComposeDraft[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row) => row && typeof row.id === "string");
  } catch {
    return [];
  }
}

function write(rows: OpsComposeDraft[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(rows));
  notify();
}

/** One-time move of the old single browser draft into the drafts list. */
function migrateLegacy(): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(LEGACY_DRAFT_KEY);
  if (!raw) return;
  localStorage.removeItem(LEGACY_DRAFT_KEY);
  try {
    const legacy = JSON.parse(raw) as Partial<OpsComposeDraft>;
    const draft: OpsComposeDraft = {
      id: crypto.randomUUID(),
      to: Array.isArray(legacy.to) ? legacy.to.filter((item) => typeof item === "string") : [],
      cc: Array.isArray(legacy.cc) ? legacy.cc.filter((item) => typeof item === "string") : [],
      subject: typeof legacy.subject === "string" ? legacy.subject : "",
      body: legacy.body?.type === "doc" ? legacy.body : emptyDoc(),
      allowReplies: Boolean(legacy.allowReplies),
      fromKey: typeof legacy.fromKey === "string" ? legacy.fromKey : "",
      updatedAt: new Date().toISOString(),
    };
    if (!hasContent(draft)) return;
    const rows = readRaw().filter((row) => row.id !== draft.id);
    write([draft, ...rows]);
  } catch {
    /* ignore a broken legacy blob */
  }
}

export function listOpsComposeDrafts(): OpsComposeDraft[] {
  migrateLegacy();
  return readRaw().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function loadOpsComposeDraft(id: string): OpsComposeDraft | null {
  return listOpsComposeDrafts().find((row) => row.id === id) ?? null;
}

export function opsComposeDraftPreview(draft: OpsComposeDraft): string {
  return docToPlainText(draft.body).replace(/\s+/g, " ").trim();
}

/** Saves a non-empty draft and drops an empty one. Returns the stored id. */
export function upsertOpsComposeDraft(
  draft: Omit<OpsComposeDraft, "updatedAt">,
): string | null {
  migrateLegacy();
  const rows = readRaw().filter((row) => row.id !== draft.id);
  if (!hasContent(draft)) {
    write(rows);
    return null;
  }
  const next: OpsComposeDraft = { ...draft, updatedAt: new Date().toISOString() };
  write([next, ...rows]);
  return draft.id;
}

export function removeOpsComposeDraft(id: string): void {
  write(readRaw().filter((row) => row.id !== id));
}
