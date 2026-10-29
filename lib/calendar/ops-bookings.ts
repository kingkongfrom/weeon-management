import "server-only";

import { unstable_cache } from "next/cache";

import { costaRicaParts } from "@/lib/calendar/costa-rica-parts";

export { costaRicaParts };

/**
 * Cal.com bookings for the Ops dashboard strip.
 *
 * Source: the same Cal.com event the marketing site books demos into
 * (`NEXT_PUBLIC_CALCOM_LINK` in `weeon-marketing`, default
 * `weeon-school/meeting`). Ops does not create bookings — it only reads the
 * schedule so the team sees the day's demos without opening Cal.com.
 *
 * Auth: a Cal.com API key (v2, `Authorization: Bearer cal_…`), server-only.
 * Without `CALCOM_API_KEY` the loader returns `configured: false` and the strip
 * simply does not render — no error, no broken panel.
 *
 * Caching: 15 minutes (`unstable_cache`), which is well inside Cal.com's limits
 * and fast enough for a landing page that is opened many times a day.
 */

const CALCOM_API = "https://api.cal.com/v2/bookings";
const CALCOM_API_VERSION = "2026-05-01";
const CACHE_SECONDS = 15 * 60;

/** One booking, reduced to what a day cell needs. */
export type OpsBooking = {
  uid: string;
  title: string;
  /** Calendar date in Costa Rica (`YYYY-MM-DD`). */
  date: string;
  /** Local start time, e.g. "09:30". */
  startTime: string;
  /** Local end time, e.g. "10:00". */
  endTime: string;
  attendeeName: string | null;
  attendeeEmail: string | null;
  status: string;
  /** Cal.com booking page for this event, when the slug is known. */
  url: string | null;
};

export type OpsBookingsSnapshot = {
  fetchedAt: string;
  configured: boolean;
  reason?: string;
  bookings: OpsBooking[];
};

type RawBooking = {
  uid?: unknown;
  title?: unknown;
  start?: unknown;
  end?: unknown;
  status?: unknown;
  attendees?: unknown;
  eventType?: { slug?: unknown } | null;
};

function trimEnv(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

export function calcomApiKey(): string | undefined {
  return trimEnv(process.env.CALCOM_API_KEY);
}

/**
 * Event being read. Defaults to the marketing booking link so Ops follows the
 * same calendar without extra setup; `CALCOM_EVENT_TYPE_ID` narrows the query.
 */
function eventTypeId(): number | null {
  const raw = trimEnv(process.env.CALCOM_EVENT_TYPE_ID);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function bookingLink(): string {
  return trimEnv(process.env.CALCOM_BOOKING_LINK) ?? "weeon-school/meeting";
}


function firstAttendee(value: unknown): { name: string | null; email: string | null } {
  if (!Array.isArray(value) || value.length === 0) return { name: null, email: null };
  const first = value[0] as { name?: unknown; email?: unknown } | null;
  return {
    name: typeof first?.name === "string" && first.name.trim() ? first.name.trim() : null,
    email:
      typeof first?.email === "string" && first.email.trim() ? first.email.trim() : null,
  };
}

/**
 * Reduce Cal.com's booking payload to the strip's shape.
 *
 * Exported for tests: the important part is that every timestamp is converted
 * into Costa Rica civil time once, so the day cell and the clock never disagree.
 */
export function mapBookings(payload: unknown, bookingLinkOverride?: string): OpsBooking[] {
  // Resolved per call, not at module load: the env is only guaranteed to be
  // available when the loader runs, and tests pass their own link.
  const base = (bookingLinkOverride ?? bookingLink())
    .replace(/^https?:\/\/cal\.com\//, "")
    .replace(/\/$/, "");
  const root = payload as { data?: unknown } | null;
  if (!root || !Array.isArray(root.data)) return [];

  const bookings: OpsBooking[] = [];
  for (const entry of root.data as RawBooking[]) {
    if (!entry || typeof entry.uid !== "string") continue;
    if (typeof entry.start !== "string" || typeof entry.end !== "string") continue;
    const start = costaRicaParts(entry.start);
    const end = costaRicaParts(entry.end);
    const attendee = firstAttendee(entry.attendees);
    const slug =
      entry.eventType && typeof entry.eventType.slug === "string" ? entry.eventType.slug : null;

    bookings.push({
      uid: entry.uid,
      title: typeof entry.title === "string" && entry.title.trim() ? entry.title.trim() : "Cita",
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      status: typeof entry.status === "string" ? entry.status : "accepted",
      url: slug ? `https://cal.com/${base}/${slug}` : `https://cal.com/${base}`,
    });
  }

  return bookings
    .filter((booking) => booking.status !== "cancelled" && booking.status !== "rejected")
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
}

async function fetchBookings(): Promise<OpsBookingsSnapshot> {
  const fetchedAt = new Date().toISOString();
  const apiKey = calcomApiKey();
  if (!apiKey) {
    return {
      fetchedAt,
      configured: false,
      reason:
        "Cal.com no está configurado — agrega CALCOM_API_KEY en este proyecto de Vercel (ver docs/calendar.md).",
      bookings: [],
    };
  }

  const params = new URLSearchParams({ status: "upcoming", limit: "100" });
  const eventType = eventTypeId();
  if (eventType !== null) params.set("eventTypeId", String(eventType));

  try {
    const response = await fetch(`${CALCOM_API}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": CALCOM_API_VERSION,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return {
        fetchedAt,
        configured: true,
        reason: `Cal.com respondió HTTP ${response.status}.`,
        bookings: [],
      };
    }

    const payload = await response.json();
    return { fetchedAt, configured: true, bookings: mapBookings(payload) };
  } catch {
    return { fetchedAt, configured: true, reason: "No se pudo consultar Cal.com.", bookings: [] };
  }
}

export function loadOpsBookings(): Promise<OpsBookingsSnapshot> {
  return unstable_cache(fetchBookings, ["ops-calcom-bookings-v1"], {
    revalidate: CACHE_SECONDS,
  })();
}

