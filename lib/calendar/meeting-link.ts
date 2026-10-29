/**
 * Where a demo happens, and whether Ops can join it right now.
 *
 * Cal.com stores the destination in `location`, which may be:
 * - a video URL ("Cal Video", Zoom, Meet) → joinable,
 * - an in-person address or a phone number → displayed, not joinable,
 * - empty → nothing to show.
 *
 * Pure and client-safe so both the strip and the meetings table share it.
 */

export type MeetingLink =
  | { kind: "url"; href: string }
  | { kind: "text"; text: string }
  | { kind: "none" };

/** Minutes before the start when the join button becomes usable. */
export const JOIN_WINDOW_BEFORE_MIN = 15;
/** Minutes after the end when it stops being offered. */
export const JOIN_WINDOW_AFTER_MIN = 15;

export function meetingLink(location: string | null | undefined): MeetingLink {
  const value = location?.trim();
  if (!value) return { kind: "none" };

  // Only http(s): `javascript:` and friends must never become an href.
  if (/^https?:\/\//i.test(value)) return { kind: "url", href: value };
  if (value.startsWith("//")) return { kind: "url", href: `https:${value}` };

  return { kind: "text", text: value };
}

export type JoinState =
  | { state: "open"; href: string }
  /** Joinable, but not yet — `minutes` until the window opens. */
  | { state: "early"; href: string; minutes: number }
  /** Joinable, but the window has closed. */
  | { state: "past"; href: string }
  /** Nothing to join: no URL, or the "location" is an address/phone. */
  | { state: "unavailable" };

/**
 * Decide what the join control shows.
 *
 * `now` is injected so this is testable and so the caller controls the clock
 * (server render + client hydration agree on one value).
 */
export function joinState(
  meeting: { startsAt: string; endsAt: string; location: string | null },
  now: Date,
): JoinState {
  const link = meetingLink(meeting.location);
  if (link.kind !== "url") return { state: "unavailable" };

  const start = new Date(meeting.startsAt).getTime();
  const end = new Date(meeting.endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return { state: "unavailable" };

  const at = now.getTime();
  const opensAt = start - JOIN_WINDOW_BEFORE_MIN * 60_000;
  const closesAt = end + JOIN_WINDOW_AFTER_MIN * 60_000;

  if (at < opensAt) {
    return {
      state: "early",
      href: link.href,
      minutes: Math.max(1, Math.round((opensAt - at) / 60_000)),
    };
  }
  if (at > closesAt) return { state: "past", href: link.href };
  return { state: "open", href: link.href };
}
