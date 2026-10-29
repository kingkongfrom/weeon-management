import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { HANDLED_TRIGGERS, toDemoMeetingRow } from "@/lib/calendar/demo-meetings";
import { upsertDemoMeetings } from "@/lib/calendar/demo-meetings-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cal.com webhook → `public.demo_meetings`.
 *
 * Configure in Cal.com → Settings → Developer → Webhooks:
 *   subscriber URL  https://ops.weeon.school/api/calcom/webhook
 *   secret          the same value as CALCOM_WEBHOOK_SECRET here
 *   triggers        BOOKING_CREATED, BOOKING_REQUESTED, BOOKING_RESCHEDULED,
 *                   BOOKING_CANCELLED, BOOKING_REJECTED, MEETING_ENDED
 *   version         2026-07-27 (adds ICS content; we ignore it)
 *
 * Signature: Cal.com sends `x-cal-signature-256` = HMAC-SHA256(raw body, secret).
 * The raw body is required, so this route reads `request.text()` — never
 * `request.json()` before verifying.
 *
 * Delivery is at-least-once: the SQL upsert is idempotent on `cal_uid`, so a
 * retry is harmless. Unknown triggers are acknowledged with 200 so Cal.com
 * stops retrying them.
 */

function verify(rawBody: string, secret: string, header: string | null): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = header.trim().toLowerCase();
  if (given.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(given, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.CALCOM_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verify(rawBody, secret, request.headers.get("x-cal-signature-256"))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const trigger = (body as { triggerEvent?: unknown } | null)?.triggerEvent;
  if (typeof trigger !== "string" || !HANDLED_TRIGGERS.has(trigger)) {
    return NextResponse.json({ ok: true, ignored: trigger ?? null });
  }

  const row = toDemoMeetingRow(body);
  if (!row) {
    // A payload we cannot map must not be retried forever; log and accept.
    return NextResponse.json({ ok: true, skipped: "unsupported_payload" });
  }

  const result = await upsertDemoMeetings([row]);
  if (result.error) {
    // 500 so Cal.com retries — the booking would otherwise be invisible in Ops.
    return NextResponse.json({ error: "store_failed", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, trigger, uid: row.cal_uid });
}
