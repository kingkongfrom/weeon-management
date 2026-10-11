import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";

export type SchoolActivityCategory =
  | "all"
  | "auth"
  | "teacher"
  | "student"
  | "group"
  | "admin"
  | "fee";

export type SchoolActivityRange = "7d" | "30d" | "90d" | "all";

export type SchoolActivityEntry = {
  id: string;
  eventType: string;
  summary: string;
  actorName: string;
  actorEmail: string | null;
  createdAt: string;
};

type ProfileSnippet = { name: string; email: string };

function resolveActor(
  profiles: ProfileSnippet | ProfileSnippet[] | null | undefined,
): ProfileSnippet | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

function rangeToSince(range: SchoolActivityRange): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since.toISOString();
}

function categoryPrefix(category: SchoolActivityCategory): string | null {
  switch (category) {
    case "all":
      return null;
    case "auth":
      return "auth.";
    case "teacher":
      return "teacher.";
    case "student":
      return "student.";
    case "group":
      return "group.";
    case "admin":
      return "admin.";
    case "fee":
      return "fee.";
    default:
      return null;
  }
}

export type ListSchoolActivityOptions = {
  limit?: number;
  category?: SchoolActivityCategory;
  range?: SchoolActivityRange;
};

/** Cross-tenant read of school-admin actions (`activity_events`). Service-role only. */
export async function listSchoolActivity(
  tenantId: string,
  options: ListSchoolActivityOptions = {},
): Promise<SchoolActivityEntry[]> {
  const limit = options.limit ?? 200;
  const category = options.category ?? "all";
  const range = options.range ?? "30d";
  const since = rangeToSince(range);
  const prefix = categoryPrefix(category);

  const client = createPlatformClient();
  let query = client
    .from("activity_events")
    .select(
      "id, event_type, summary, created_at, actor_id, actor_name, actor_email, profiles:actor_id ( name, email )",
    )
    .eq("tenant_id", tenantId)
    .not("actor_id", "is", null)
    .not("actor_name", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gte("created_at", since);
  }
  if (prefix) {
    query = query.like("event_type", `${prefix}%`);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row) => {
    const actor = resolveActor(
      row.profiles as ProfileSnippet | ProfileSnippet[] | null | undefined,
    );
    const snapshotName = (row.actor_name as string | null)?.trim() || null;
    const snapshotEmail = (row.actor_email as string | null)?.trim() || null;
    const actorName =
      snapshotName ?? (actor?.name?.trim() || "School administrator");
    const actorEmail = snapshotEmail ?? actor?.email ?? null;

    return {
      id: row.id as string,
      eventType: row.event_type as string,
      summary: row.summary as string,
      actorName,
      actorEmail,
      createdAt: row.created_at as string,
    };
  });
}
