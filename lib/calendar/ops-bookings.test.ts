import { describe, expect, it } from "vitest";

import { costaRicaParts, mapBookings } from "@/lib/calendar/ops-bookings";

const payload = {
  status: "success",
  data: [
    {
      uid: "b2",
      title: "Demo — Colegio San José",
      start: "2026-10-28T15:30:00Z", // 09:30 in Costa Rica (UTC−6)
      end: "2026-10-28T16:00:00Z",
      status: "accepted",
      attendees: [{ name: "Ana Mora", email: "ana@colegio.cr" }],
      eventType: { slug: "meeting" },
    },
    {
      uid: "b1",
      title: "Llamada de seguimiento",
      start: "2026-10-26T14:00:00Z",
      end: "2026-10-26T14:30:00Z",
      status: "accepted",
      attendees: [],
      eventType: { slug: "meeting" },
    },
    {
      uid: "b3",
      title: "Cancelada",
      start: "2026-10-27T14:00:00Z",
      end: "2026-10-27T14:30:00Z",
      status: "cancelled",
      attendees: [],
      eventType: null,
    },
  ],
};

describe("costaRicaParts", () => {
  it("converts an instant to the Ops civil date and clock", () => {
    expect(costaRicaParts("2026-10-28T15:30:00Z")).toEqual({ date: "2026-10-28", time: "09:30" });
  });

  it("rolls the date back when the instant is late UTC", () => {
    expect(costaRicaParts("2026-10-29T02:00:00Z")).toEqual({ date: "2026-10-28", time: "20:00" });
  });
});

describe("mapBookings", () => {
  it("drops cancelled bookings and sorts by start", () => {
    const bookings = mapBookings(payload);
    expect(bookings.map((booking) => booking.uid)).toEqual(["b1", "b2"]);
  });

  it("carries the attendee and a Cal.com link", () => {
    const [, second] = mapBookings(payload);
    expect(second?.attendeeName).toBe("Ana Mora");
    expect(second?.startTime).toBe("09:30");
    expect(second?.url).toBe("https://cal.com/weeon-school/meeting/meeting");
  });

  it("tolerates a payload with no data", () => {
    expect(mapBookings({})).toEqual([]);
    expect(mapBookings(null)).toEqual([]);
  });
});

