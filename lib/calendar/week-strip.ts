import "server-only";

import { unstable_cache } from "next/cache";

import { loadUpcomingDemoMeetings, type StoredDemoMeeting } from "@/lib/calendar/demo-meetings-store";
import { costaRicaParts } from "@/lib/calendar/costa-rica-parts";

/** Internal: exported so the tests can drive the window without a DB. */
export { meetingsByWeekday } from "@/lib/calendar/week-window";

/**
 * Demo meetings for the Ops landing strip.
 *
 * Reads the mirrored `public.demo_meetings` table (service role), not Cal.com
 * directly: the webhook and the 15-minute reconcile job keep it current, so a
 * page render never blocks on a third-party API, and the strip still shows the
 * meeting if Cal.com is having a bad day.
 */

export type StripMeeting = {
  id: string;
  title: string;
  /** Costa Rica civil date, `YYYY-MM-DD`. */
  date: string;
  startTime: string;
  endTime: string;
  attendeeName: string | null;
  attendeeEmail: string | null;
  /** True for a booking Cal.com has not confirmed yet. */
  pending: boolean;
  /** Where the demo happens (video URL, address or phone as Cal.com reports it). */
  location: string | null;
  /** UTC instants, for the join window. */
  startsAt: string;
  endsAt: string;
};

export type StripSnapshot = {
  configured: boolean;
  reason?: string;
  meetings: StripMeeting[];
};

const CACHE_SECONDS = 60;

/**
 * Cal.com titles are verbose ("30 min meeting between X and Y"). Ops only runs
 * one event type — the school demo — so the strip shows where the demo is, not
 * a restatement of the booking.
 */
function shortName(meeting: StoredDemoMeeting): string {
  const responses = meeting.bookingResponses;
  const school = responses.colegio ?? responses.school ?? responses["institución"] ?? responses.institucion;
  const value = typeof school === "string" ? school.trim() : "";
  if (value) return value;
  if (meeting.attendeeName?.trim()) return meeting.attendeeName.trim();
  const title = meeting.title.trim();
  const between = /between\s+(.+?)\s+and\s+/i.exec(title);
  if (between?.[1]) return between[1].trim();
  return title.replace(/\s*[—-]\s*.*$/, "").slice(0, 40) || "Demo";
}

function toStrip(meeting: StoredDemoMeeting): StripMeeting {
  const start = costaRicaParts(meeting.startsAt);
  const end = costaRicaParts(meeting.endsAt);
  return {
    id: meeting.id,
    title: shortName(meeting),
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    attendeeName: meeting.attendeeName,
    attendeeEmail: meeting.attendeeEmail,
    pending: meeting.calStatus === "pending" || meeting.calStatus === "awaiting_host",
    location: meeting.location,
    startsAt: meeting.startsAt,
    endsAt: meeting.endsAt,
  };
}

async function compute(todayISO: string): Promise<StripSnapshot> {
  const result = await loadUpcomingDemoMeetings(todayISO);
  return {
    configured: !result.reason,
    reason: result.reason,
    meetings: result.meetings.map(toStrip),
  };
}

/** Cached per day (the query is bounded to the current week by the caller). */
export function loadWeekStrip(todayISO: string): Promise<StripSnapshot> {
  return unstable_cache(() => compute(todayISO), ["ops-week-strip-v1", todayISO], {
    revalidate: CACHE_SECONDS,
  })();
}

