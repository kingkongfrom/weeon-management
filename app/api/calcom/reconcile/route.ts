import { NextResponse } from "next/server";
import { syncUpcomingBookings } from "@/lib/calendar/demo-meetings-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reconcile `demo_meetings` with Cal.com.
 *
 * Webhooks are fast but lossy (endpoint down, deploy in flight, missed
 * delivery). This job re-reads the upcoming page from the Cal.com API and
 * upserts it, so Ops can never silently drift from Cal.com.
 *
 *   GET  /api/calcom/reconcile   (Vercel cron, `Authorization: Bearer $CRON_SECRET`)
 *   POST /api/calcom/reconcile   (same auth; for a manual run)
 *
 * Schedule it every 15 minutes — the same effective freshness as the on-demand
 * cache the landing page used before.
 */

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: "reconcile_not_configured" }, { status: 503 });
  }
  if (!authorised(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await syncUpcomingBookings();
  if (result.error) {
    return NextResponse.json({ ok: false, ...result }, { status: 502 });
  }
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
