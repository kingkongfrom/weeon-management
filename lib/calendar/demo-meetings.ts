import "server-only";

import { WEEON_OPS_TIME_ZONE } from "@/lib/datetime/costa-rica";
import { costaRicaParts } from "@/lib/calendar/ops-bookings";

/**
 * Normalises Cal.com data into the rows Ops stores in `public.demo_meetings`.
 *
 * Two inputs, one shape:
 * - **Webhook payloads** (`BOOKING_CREATED`, `BOOKING_CANCELLED`, …) carry
 *   `{ triggerEvent, createdAt, payload: { uid, title, startTime, endTime, … } }`.
 * - **API responses** (`GET /v2/bookings`) carry `{ data: [{ uid, start, end, … }] }`.
 *
 * Keeping the mapping pure and shared means the reconcile job and the webhook
 * can never disagree about what a booking is.
 */

export type DemoMeetingRow = {
  cal_uid: string;
  rescheduled_from_uid: string | null;
  title: string;
  event_type_slug: string | null;
  event_type_id: string | null;
  starts_at: string;
  ends_at: string;
  meeting_date: string;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  attendee_time_zone: string | null;
  booking_responses: Record<string, string>;
  location: string | null;
  cal_status: "accepted" | "pending" | "cancelled" | "rejected" | "awaiting_host";
  raw: unknown;
};

type Loose = Record<string, unknown>;

function asRecord(value: unknown): Loose | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Loose) : null;
}

function str(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function iso(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function responses(value: unknown): Record<string, string> {
  const record = asRecord(value);
  if (!record) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(record)) {
    if (typeof raw === "string") out[key.slice(0, 80)] = raw.slice(0, 500);
    else if (typeof raw === "number" || typeof raw === "boolean") out[key.slice(0, 80)] = String(raw);
  }
  return out;
}

/** Cal.com status → our constrained column. Unknown values become `accepted`. */
function status(value: unknown): DemoMeetingRow["cal_status"] {
  switch (value) {
    case "cancelled":
    case "pending":
    case "rejected":
    case "awaiting_host":
      return value;
    default:
      return "accepted";
  }
}

function firstAttendee(value: unknown): Loose | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return asRecord(value[0]);
}

/**
 * Build a stored row, or `null` when the payload lacks the minimum a meeting
 * needs (uid + start + end). Anything unusable is dropped, never guessed.
 */
export function toDemoMeetingRow(input: unknown): DemoMeetingRow | null {
  const root = asRecord(input);
  if (!root) return null;

  // Webhook shape nests everything under `payload`; API rows are flat.
  const payload = asRecord(root.payload) ?? root;

  const uid = str(payload.uid, 120);
  const startsAt = iso(payload.startTime ?? payload.start);
  const endsAt = iso(payload.endTime ?? payload.end);
  if (!uid || !startsAt || !endsAt) return null;

  const attendee = firstAttendee(payload.attendees);
  const eventRef = asRecord(payload.eventType);

  return {
    cal_uid: uid,
    rescheduled_from_uid:
      str(payload.rescheduledFromUid, 120) ?? str(root.rescheduledFromUid, 120),
    title: str(payload.title, 200) ?? "Demo",
    event_type_slug: str(eventRef?.slug, 80) ?? str(payload.type, 80),
    event_type_id:
      typeof eventRef?.id === "number"
        ? String(eventRef.id)
        : typeof payload.eventTypeId === "number"
          ? String(payload.eventTypeId)
          : null,
    starts_at: startsAt,
    ends_at: endsAt,
    // Grouping key for every Ops view: the Costa Rica civil date of the start.
    meeting_date: costaRicaParts(startsAt).date,
    attendee_name: str(attendee?.name, 160),
    attendee_email: str(attendee?.email, 320)?.toLowerCase() ?? null,
    attendee_phone: str(attendee?.phoneNumber, 40),
    attendee_time_zone: str(attendee?.timeZone, 64),
    booking_responses: {
      ...responses(payload.bookingFieldsResponses),
      ...responses(attendee?.bookingFieldsResponses),
    },
    location: str(payload.location, 500),
    cal_status: status(payload.status),
    // Keep the original for audit; the normalised columns are what we query.
    raw: input,
  };
}

/** Map an API `GET /v2/bookings` response into storable rows. */
export function toDemoMeetingRows(payload: unknown): DemoMeetingRow[] {
  const root = asRecord(payload);
  if (!root || !Array.isArray(root.data)) return [];
  return root.data
    .map((entry) => toDemoMeetingRow(entry))
    .filter((row): row is DemoMeetingRow => row !== null);
}

/**
 * Webhook triggers that change the Ops record. Others (reminders, recordings)
 * are acknowledged and ignored so Cal.com does not retry them forever.
 */
export const HANDLED_TRIGGERS = new Set([
  "BOOKING_CREATED",
  "BOOKING_REQUESTED",
  "BOOKING_RESCHEDULED",
  "BOOKING_CANCELLED",
  "BOOKING_REJECTED",
  "MEETING_ENDED",
  "BOOKING_NO_SHOW_UPDATED",
]);

/** Human label used in the Ops table, in Costa Rica civil time. */
export function meetingSlotLabel(row: Pick<DemoMeetingRow, "starts_at" | "ends_at">): string {
  const start = costaRicaParts(row.starts_at);
  const end = costaRicaParts(row.ends_at);
  return `${start.time}–${end.time}`;
}

export const OPS_TZ_LABEL = WEEON_OPS_TIME_ZONE;
