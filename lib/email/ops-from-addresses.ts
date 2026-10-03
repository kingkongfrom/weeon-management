import "server-only";

import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth/policy";
import { brandedFromAddress } from "@/lib/email/send";

export type OpsFromAddressOption = {
  key: string;
  email: string;
  displayName: string;
  /** Full Resend `from` string. */
  resendFrom: string;
  label: string;
};

function parseFromEntry(raw: string): OpsFromAddressOption | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let displayName = "Weeon School";
  let email = trimmed;
  const angle = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (angle) {
    displayName = angle[1]!.trim().replace(/^["']|["']$/g, "");
    email = angle[2]!.trim();
  } else if (!trimmed.includes("@")) {
    return null;
  }

  email = email.toLowerCase();
  if (!email.includes("@")) return null;

  const name = displayName || email;
  const resendFrom = `${name} <${email}>`;

  return {
    key: email,
    email,
    displayName: name,
    resendFrom,
    label: `${name} · ${email}`,
  };
}

function staffDisplayName(email: string): string {
  const local = email.split("@")[0] ?? "staff";
  return local
    .replace(/[.+_-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** Verified / allowed From identities for Ops compose (Resend must allow each address). */
export function listOpsFromAddressOptions(actorEmail: string): OpsFromAddressOption[] {
  const seen = new Set<string>();
  const out: OpsFromAddressOption[] = [];

  function add(raw: string) {
    const opt = parseFromEntry(raw);
    if (!opt || seen.has(opt.key)) return;
    seen.add(opt.key);
    out.push(opt);
  }

  const configured = process.env.OPS_EMAIL_FROM_ALIASES?.trim();
  if (configured) {
    for (const part of configured.split(/[,;\n]+/)) {
      add(part);
    }
  } else {
    add(process.env.RESEND_FROM?.trim() || "Weeon School <ops@weeon.school>");
    add("Weeon School <support@weeon.school>");
    add("Weeon School <hello@weeon.school>");
  }

  const actor = actorEmail.trim().toLowerCase();
  if (actor.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    add(`${staffDisplayName(actor)} <${actor}>`);
  }

  const defaultFrom = parseFromEntry(brandedFromAddress());
  if (defaultFrom) {
    const idx = out.findIndex((row) => row.key === defaultFrom.key);
    if (idx === -1) {
      out.unshift(defaultFrom);
    } else if (idx > 0) {
      const [row] = out.splice(idx, 1);
      out.unshift(row!);
    }
  }

  if (out.length === 0) {
    add("Weeon School <ops@weeon.school>");
  }

  return out;
}

export function resolveOpsFromAddress(
  actorEmail: string,
  fromKey: string | undefined,
): { ok: true; option: OpsFromAddressOption } | { ok: false; error: string } {
  const options = listOpsFromAddressOptions(actorEmail);
  const key = fromKey?.trim().toLowerCase() || options[0]?.key;
  const found = options.find((row) => row.key === key);
  if (!found) {
    return { ok: false, error: "La dirección de envío no es válida." };
  }
  return { ok: true, option: found };
}
