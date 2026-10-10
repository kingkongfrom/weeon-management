import { describe, it, expect } from "vitest";
import {
  DELINQUENCY_GRACE_DAYS,
  isManualStatusAction,
  parseSuspendReason,
} from "@/lib/platform/tenant-status";

describe("isManualStatusAction", () => {
  it("accepts only the manual Ops subset", () => {
    expect(isManualStatusAction("suspend")).toBe(true);
    expect(isManualStatusAction("reactivate")).toBe(true);
    expect(isManualStatusAction("mark_past_due")).toBe(true);
    expect(isManualStatusAction("mark_active")).toBe(true);
  });

  it("rejects lifecycle-driven statuses", () => {
    expect(isManualStatusAction("demo")).toBe(false);
    expect(isManualStatusAction("demo_expired")).toBe(false);
    expect(isManualStatusAction("trial")).toBe(false);
    expect(isManualStatusAction("trial_expired")).toBe(false);
    expect(isManualStatusAction("")).toBe(false);
  });
});

describe("parseSuspendReason", () => {
  it("only recognises delinquency; everything else is manual", () => {
    expect(parseSuspendReason("delinquency")).toBe("delinquency");
    expect(parseSuspendReason("manual")).toBe("manual");
    expect(parseSuspendReason("whatever")).toBe("manual");
    expect(parseSuspendReason(null)).toBe("manual");
    expect(parseSuspendReason(undefined)).toBe("manual");
  });
});

describe("DELINQUENCY_GRACE_DAYS", () => {
  it("is a 7-day grace window", () => {
    expect(DELINQUENCY_GRACE_DAYS).toBe(7);
  });
});
