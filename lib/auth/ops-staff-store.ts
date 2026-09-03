import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { normalizeEmail } from "@/lib/auth/policy";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 24 * 60 * 60 * 1000;

export type OpsTokenKind = "invite" | "reset";

export type OpsStaffMemberRecord = {
  email: string;
  userId: string | null;
  name: string | null;
  pending: boolean;
  invitedAt: string;
  acceptedAt: string | null;
};

export type OpsStaffTokenRecord = {
  tokenHash: string;
  email: string;
  kind: OpsTokenKind;
  userId: string | null;
  expiresAt: string;
  consumedAt: string | null;
};

type OpsStaffState = {
  members: OpsStaffMemberRecord[];
  tokens: OpsStaffTokenRecord[];
};

function storePath(): string {
  return join(process.cwd(), "data", "ops-staff.json");
}

async function readState(): Promise<OpsStaffState> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<OpsStaffState>;
    return {
      members: Array.isArray(parsed.members) ? parsed.members : [],
      tokens: Array.isArray(parsed.tokens) ? parsed.tokens : [],
    };
  } catch {
    return { members: [], tokens: [] };
  }
}

async function writeState(state: OpsStaffState): Promise<void> {
  const path = storePath();
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await rename(tmp, path);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function listInvitedOpsMembers(): Promise<OpsStaffMemberRecord[]> {
  const state = await readState();
  return state.members.map((member) => ({
    ...member,
    email: normalizeEmail(member.email),
  }));
}

export async function getInvitedOpsMember(
  emailInput: string,
): Promise<OpsStaffMemberRecord | null> {
  const email = normalizeEmail(emailInput);
  const members = await listInvitedOpsMembers();
  return members.find((member) => member.email === email) ?? null;
}

export async function upsertInvitedOpsMember(
  input: Pick<OpsStaffMemberRecord, "email" | "userId" | "name" | "pending"> & {
    acceptedAt?: string | null;
  },
): Promise<OpsStaffMemberRecord> {
  const email = normalizeEmail(input.email);
  const state = await readState();
  const now = new Date().toISOString();
  const existing = state.members.find((member) => normalizeEmail(member.email) === email);
  const next: OpsStaffMemberRecord = {
    email,
    userId: input.userId ?? existing?.userId ?? null,
    name: input.name ?? existing?.name ?? null,
    pending: input.pending,
    invitedAt: existing?.invitedAt ?? now,
    acceptedAt: input.acceptedAt ?? (input.pending ? null : now),
  };

  state.members = [
    ...state.members.filter((member) => normalizeEmail(member.email) !== email),
    next,
  ];
  await writeState(state);
  return next;
}

export async function markInvitedOpsMemberAccepted(
  emailInput: string,
  userId?: string | null,
): Promise<void> {
  const existing = await getInvitedOpsMember(emailInput);
  await upsertInvitedOpsMember({
    email: emailInput,
    userId: userId ?? existing?.userId ?? null,
    name: existing?.name ?? null,
    pending: false,
    acceptedAt: new Date().toISOString(),
  });
}

export async function mintOpsToken(
  emailInput: string,
  kind: OpsTokenKind,
  ttlMs: number,
  userId?: string | null,
): Promise<{ token: string; email: string; expiresAt: string; userId: string | null }> {
  const email = normalizeEmail(emailInput);
  const token = newToken();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const state = await readState();
  state.tokens = state.tokens.filter(
    (row) => !(row.kind === kind && normalizeEmail(row.email) === email && !row.consumedAt),
  );
  state.tokens.push({
    tokenHash: hashToken(token),
    email,
    kind,
    userId: userId ?? null,
    expiresAt,
    consumedAt: null,
  });
  await writeState(state);
  return { token, email, expiresAt, userId: userId ?? null };
}

export async function peekOpsToken(
  token: string,
  kind: OpsTokenKind,
): Promise<{ email: string; userId: string | null } | null> {
  if (!token) return null;
  const state = await readState();
  const row = state.tokens.find((item) => item.tokenHash === hashToken(token) && item.kind === kind);
  if (!row || row.consumedAt) return null;
  if (new Date(row.expiresAt).getTime() <= Date.now()) return null;
  return { email: normalizeEmail(row.email), userId: row.userId ?? null };
}

export async function consumeOpsToken(
  token: string,
  kind: OpsTokenKind,
): Promise<{ email: string; userId: string | null } | null> {
  const peeked = await peekOpsToken(token, kind);
  if (!peeked) return null;
  const state = await readState();
  const hash = hashToken(token);
  state.tokens = state.tokens.map((row) =>
    row.tokenHash === hash && row.kind === kind
      ? { ...row, consumedAt: new Date().toISOString() }
      : row,
  );
  await writeState(state);
  return peeked;
}
