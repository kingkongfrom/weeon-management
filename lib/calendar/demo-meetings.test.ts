import { describe, expect, it } from "vitest";

import { HANDLED_TRIGGERS, toDemoMeetingRow, toDemoMeetingRows } from "@/lib/calendar/demo-meetings";
import { meetingsByWeekday, weekWindow } from "@/lib/calendar/week-window";

const webhookPayload = {
  triggerEvent: "BOOKING_CREATED",
  createdAt: "2026-10-28T14:00:00.000Z",
  payload: {
    uid: "abc123",
    title: "Demo Weeon School",
    startTime: "2026-10-29T15:30:00Z", // 09:30 Costa Rica
    endTime: "2026-10-29T16:00:00Z",
    status: "accepted",
    type: "meeting",
    location: "https://meet.google.com/xyz",
    attendees: [
      {
        name: "Ana Mora",
        email: "Ana.Mora@Colegio.cr",
        phoneNumber: "+50688887777",
        timeZone: "America/Costa_Rica",
        bookingFieldsResponses: { colegio: "Colegio San José", estudiantes: "420" },
      },
    ],
  },
};

describe("toDemoMeetingRow", () => {
  it("maps a webhook payload to the stored columns", () => {
    const row = toDemoMeetingRow(webhookPayload);
    expect(row).not.toBeNull();
    expect(row?.cal_uid).toBe("abc123");
    expect(row?.starts_at).toBe("2026-10-29T15:30:00.000Z");
    expect(row?.meeting_date).toBe("2026-10-29");
    expect(row?.attendee_email).toBe("ana.mora@colegio.cr");
    expect(row?.cal_status).toBe("accepted");
    expect(row?.booking_responses.colegio).toBe("Colegio San José");
    expect(row?.event_type_slug).toBe("meeting");
  });

  it("uses the Costa Rica date, so a late-UTC booking lands on the right day", () => {
    const row = toDemoMeetingRow({
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "late1",
        startTime: "2026-10-30T02:00:00Z", // 20:00 on the 29th in CR
        endTime: "2026-10-30T02:30:00Z",
        attendees: [],
      },
    });
    expect(row?.meeting_date).toBe("2026-10-29");
  });

  it("maps an API row (flat shape)", () => {
    const [row] = toDemoMeetingRows({
      data: [
        {
          uid: "api1",
          title: "Seguimiento",
          start: "2026-10-28T15:00:00Z",
          end: "2026-10-28T15:30:00Z",
          status: "pending",
          eventType: { id: 42, slug: "meeting" },
          attendees: [{ name: "Luis", email: "luis@x.cr" }],
        },
      ],
    });
    expect(row?.cal_uid).toBe("api1");
    expect(row?.cal_status).toBe("pending");
    expect(row?.event_type_id).toBe("42");
  });

  it("drops rows without the minimum fields", () => {
    expect(toDemoMeetingRow({ payload: { uid: "only-uid" } })).toBeNull();
    expect(toDemoMeetingRow(null)).toBeNull();
    expect(toDemoMeetingRows({})).toEqual([]);
  });

  it("coerces unknown statuses to accepted rather than failing the insert", () => {
    const row = toDemoMeetingRow({
      payload: {
        uid: "s1",
        startTime: "2026-10-28T15:00:00Z",
        endTime: "2026-10-28T15:30:00Z",
        status: "something_new",
      },
    });
    expect(row?.cal_status).toBe("accepted");
  });

  it("handles the triggers that change the record", () => {
    for (const trigger of ["BOOKING_CREATED", "BOOKING_CANCELLED", "MEETING_ENDED"]) {
      expect(HANDLED_TRIGGERS.has(trigger)).toBe(true);
    }
    expect(HANDLED_TRIGGERS.has("RECORDING_READY")).toBe(false);
  });
});

describe("week window", () => {
  it("returns Monday to Friday containing today", () => {
    // 2026-10-28 is a Wednesday.
    expect(weekWindow("2026-10-28")).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
    ]);
  });

  it("keeps Sunday in the week that ends on the coming Friday", () => {
    expect(weekWindow("2026-11-01")[0]).toBe("2026-10-26");
  });

  it("buckets meetings by their date", () => {
    const days = meetingsByWeekday(
      [
        { date: "2026-10-26", title: "A" },
        { date: "2026-10-28", title: "B" },
        { date: "2026-11-05", title: "Out of range" },
      ],
      "2026-10-28",
    );
    expect(days[0]?.meetings.map((m) => m.title)).toEqual(["A"]);
    expect(days[2]?.meetings.map((m) => m.title)).toEqual(["B"]);
    expect(days.flatMap((d) => d.meetings)).toHaveLength(2);
  });
});
