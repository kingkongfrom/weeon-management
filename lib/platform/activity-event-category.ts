import type { SchoolActivityCategory } from "@/lib/platform/school-activity";

/** Normalize legacy underscore event types (`user_created` → `user.created`). */
export function normalizeActivityEventType(eventType: string): string {
  return eventType.trim().replace(/_/g, ".");
}

export function activityEventCategory(eventType: string): SchoolActivityCategory | "other" {
  const type = normalizeActivityEventType(eventType);

  if (type.startsWith("auth.")) return "auth";
  if (type.startsWith("teacher.")) return "teacher";
  if (type.startsWith("student.")) return "student";
  if (type.startsWith("group.")) return "group";
  if (type.startsWith("fee.") || type.startsWith("payment.")) return "fee";
  if (
    type.startsWith("admin.") ||
    type === "user.added" ||
    type === "user.created"
  ) {
    return "admin";
  }

  return "other";
}

export function matchesActivityCategory(
  eventType: string,
  category: SchoolActivityCategory,
): boolean {
  if (category === "all") return true;
  return activityEventCategory(eventType) === category;
}
