import { describe, expect, it } from "vitest";

import { joinState, meetingLink } from "@/lib/calendar/meeting-link";

const meeting = {
  startsAt: "2026-10-29T20:30:00Z",
  endsAt: "2026-10-29T21:00:00Z",
  location: "https://app.cal.com/video/abc",
};

describe("meetingLink", () => {
  it("accepts http and https URLs", () => {
    expect(meetingLink("https://zoom.us/j/1")).toEqual({ kind: "url", href: "https://zoom.us/j/1" });
    expect(meetingLink("http://meet.example")).toEqual({ kind: "url", href: "http://meet.example" });
  });

  it("upgrades a protocol-relative URL", () => {
    expect(meetingLink("//app.cal.com/video/abc")).toEqual({
      kind: "url",
      href: "https://app.cal.com/video/abc",
    });
  });

  it("refuses dangerous schemes and keeps them as text", () => {
    expect(meetingLink("javascript:alert(1)")).toEqual({
      kind: "text",
      text: "javascript:alert(1)",
    });
  });

  it("treats an address or phone number as text", () => {
    expect(meetingLink("San José, Costa Rica")).toEqual({
      kind: "text",
      text: "San José, Costa Rica",
    });
    expect(meetingLink("+506 8888 7777").kind).toBe("text");
  });

  it("reports nothing for an empty location", () => {
    expect(meetingLink(null).kind).toBe("none");
    expect(meetingLink("   ").kind).toBe("none");
  });
});

describe("joinState", () => {
  it("is early more than 15 minutes before the start", () => {
    const state = joinState(meeting, new Date("2026-10-29T20:00:00Z"));
    expect(state).toEqual({ state: "early", href: meeting.location, minutes: 15 });
  });

  it("opens 15 minutes before the start", () => {
    expect(joinState(meeting, new Date("2026-10-29T20:15:00Z")).state).toBe("open");
  });

  it("stays open through the meeting", () => {
    expect(joinState(meeting, new Date("2026-10-29T20:45:00Z")).state).toBe("open");
  });

  it("closes 15 minutes after the end", () => {
    expect(joinState(meeting, new Date("2026-10-29T21:14:00Z")).state).toBe("open");
    expect(joinState(meeting, new Date("2026-10-29T21:16:00Z")).state).toBe("past");
  });

  it("is unavailable without a joinable location", () => {
    expect(joinState({ ...meeting, location: "Oficina central" }, new Date()).state).toBe(
      "unavailable",
    );
    expect(joinState({ ...meeting, location: null }, new Date()).state).toBe("unavailable");
  });

  it("is unavailable for an unparseable schedule", () => {
    expect(joinState({ ...meeting, startsAt: "not a date" }, new Date()).state).toBe("unavailable");
  });
});
