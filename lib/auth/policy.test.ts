import { describe, it, expect } from "vitest";
import {
  ALLOWED_EMAIL_DOMAIN,
  MAX_PLATFORM_STAFF,
  PLATFORM_STAFF_INVITER_EMAIL,
  isAllowedStaffEmail,
  isAllowedStaffEmailDomain,
  isPlatformStaffInviter,
  normalizeEmail,
} from "@/lib/auth/policy";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  EDUARDO@Weeon.School ")).toBe("eduardo@weeon.school");
  });
});

describe("isAllowedStaffEmailDomain", () => {
  it("only accepts the weeon.school domain", () => {
    expect(ALLOWED_EMAIL_DOMAIN).toBe("weeon.school");
    expect(isAllowedStaffEmailDomain("someone@weeon.school")).toBe(true);
    expect(isAllowedStaffEmailDomain("SOMEONE@WEEON.SCHOOL")).toBe(true);
    expect(isAllowedStaffEmailDomain("someone@gmail.com")).toBe(false);
    expect(isAllowedStaffEmailDomain("someone@weeon.school.evil.com")).toBe(false);
  });
});

describe("platform staff directory", () => {
  it("includes the inviter by default", () => {
    expect(isAllowedStaffEmail(PLATFORM_STAFF_INVITER_EMAIL)).toBe(true);
    expect(isPlatformStaffInviter(PLATFORM_STAFF_INVITER_EMAIL)).toBe(true);
    expect(isPlatformStaffInviter("someone-else@weeon.school")).toBe(false);
  });

  it("caps ops accounts at three", () => {
    expect(MAX_PLATFORM_STAFF).toBe(3);
  });
});
