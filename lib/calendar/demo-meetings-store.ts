import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";
import { toDemoMeetingRows, type DemoMeetingRow } from "@/lib/calendar/demo-meetings";

/**
 * Writes Cal.com bookings into `public.demo_meetings` and reads them back for
 * Ops. Service role only — this is the platform scope, never tenant RLS.
 */

export type UpsertResult = { stored: number; skipped: number; error?: string };

/** Upsert one or more normalised rows through the SQL helper. */
export async function upsertDemoMeetings(rows: DemoMeetingRow[]): Promise<UpsertResult> {
  if (rows.length === 0) return { stored: 0, skipped: 0 };

  try {
    const client = createPlatformClient();
    let stored = 0;
    for (const row of rows) {
      const { error } = await client.rpc("upsert_demo_meeting", { p_meeting: row });
      if (error) {
        return { stored, skipped: rows.length - stored, error: error.message };
      }
      stored += 1;
    }
    return { stored, skipped: rows.length - stored };
  } catch (error) {
    return {
      stored: 0,
      skipped: rows.length,
      error: error instanceof Error ? error.message : "platform client unavailable",
    };
  }
}

/** Pull the upcoming page from Cal.com and store it (the reconcile job). */
export async function syncUpcomingBookings(): Promise<UpsertResult> {
  const apiKey = process.env.CALCOM_API_KEY?.trim();
  if (!apiKey) return { stored: 0, skipped: 0, error: "CALCOM_API_KEY not set" };

  const params = new URLSearchParams({ status: "upcoming", limit: "100" });
  const eventTypeId = process.env.CALCOM_EVENT_TYPE_ID?.trim();
  if (eventTypeId) params.set("eventTypeId", eventTypeId);

  try {
    const response = await fetch(`https://api.cal.com/v2/bookings?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": "2026-05-01",
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return { stored: 0, skipped: 0, error: `Cal.com HTTP ${response.status}` };
    }
    return upsertDemoMeetings(toDemoMeetingRows(await response.json()));
  } catch (error) {
    return {
      stored: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : "Cal.com unreachable",
    };
  }
}

/* ------------------------------------------------------------------------- */
/* Reads                                                                     */
/* ------------------------------------------------------------------------- */

export type StoredDemoMeeting = {
  id: string;
  calUid: string;
  title: string;
  startsAt: string;
  endsAt: string;
  meetingDate: string;
  attendeeName: string | null;
  attendeeEmail: string | null;
  attendeePhone: string | null;
  bookingResponses: Record<string, string>;
  location: string | null;
  calStatus: DemoMeetingRow["cal_status"];
  outcome: "scheduled" | "held" | "no_show" | "cancelled" | "converted";
  notes: string | null;
  tenantId: string | null;
};

type Row = {
  id: string;
  cal_uid: string;
  title: string;
  starts_at: string;
  ends_at: string;
  meeting_date: string;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  booking_responses: Record<string, string> | null;
  location: string | null;
  cal_status: DemoMeetingRow["cal_status"];
  outcome: StoredDemoMeeting["outcome"];
  notes: string | null;
  tenant_id: string | null;
};

function toStored(row: Row): StoredDemoMeeting {
  return {
    id: row.id,
    calUid: row.cal_uid,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    meetingDate: row.meeting_date,
    attendeeName: row.attendee_name,
    attendeeEmail: row.attendee_email,
    attendeePhone: row.attendee_phone,
    bookingResponses: row.booking_responses ?? {},
    location: row.location,
    calStatus: row.cal_status,
    outcome: row.outcome,
    notes: row.notes,
    tenantId: row.tenant_id,
  };
}

const SELECT =
  "id, cal_uid, title, starts_at, ends_at, meeting_date, attendee_name, attendee_email, attendee_phone, booking_responses, location, cal_status, outcome, notes, tenant_id";

export type DemoMeetingsResult = {
  meetings: StoredDemoMeeting[];
  reason?: string;
};

/** Mirrored meetings in a date window (Costa Rica dates), newest first. */
export async function loadDemoMeetings(options?: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<DemoMeetingsResult> {
  try {
    const client = createPlatformClient();
    let query = client.from("demo_meetings").select(SELECT).order("starts_at", { ascending: false });
    if (options?.from) query = query.gte("meeting_date", options.from);
    if (options?.to) query = query.lte("meeting_date", options.to);
    query = query.limit(options?.limit ?? 200);

    const { data, error } = await query;
    if (error) {
      return {
        meetings: [],
        reason: /does not exist|schema cache/i.test(error.message)
          ? "demo_meetings no existe todavía — aplica la migración 20261028150000_demo_meetings.sql."
          : error.message,
      };
    }
    return { meetings: ((data ?? []) as Row[]).map(toStored) };
  } catch {
    return { meetings: [], reason: "No se pudo leer la base de datos de Ops." };
  }
}

/** Upcoming meetings from today, for the landing strip. */
export async function loadUpcomingDemoMeetings(todayISO: string): Promise<DemoMeetingsResult> {
  try {
    const client = createPlatformClient();
    const { data, error } = await client
      .from("demo_meetings")
      .select(SELECT)
      .gte("meeting_date", todayISO)
      .in("cal_status", ["accepted", "pending", "awaiting_host"])
      .order("starts_at", { ascending: true })
      .limit(50);

    if (error) {
      return {
        meetings: [],
        reason: /does not exist|schema cache/i.test(error.message)
          ? "demo_meetings no existe todavía — aplica la migración 20261028150000_demo_meetings.sql."
          : error.message,
      };
    }
    return { meetings: ((data ?? []) as Row[]).map(toStored) };
  } catch {
    return { meetings: [], reason: "No se pudo leer la base de datos de Ops." };
  }
}

/** Ops-owned follow-up fields. Never written by the Cal.com sync. */
export async function updateDemoMeeting(
  id: string,
  patch: Partial<Pick<StoredDemoMeeting, "outcome" | "notes" | "tenantId">>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = createPlatformClient();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.outcome !== undefined) update.outcome = patch.outcome;
    if (patch.notes !== undefined) update.notes = patch.notes;
    if (patch.tenantId !== undefined) update.tenant_id = patch.tenantId;

    const { error } = await client.from("demo_meetings").update(update).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "update failed" };
  }
}
