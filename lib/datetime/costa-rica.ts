/** Weeon Ops console displays instants in Costa Rica civil time (no DST). */
export const WEEON_OPS_TIME_ZONE = "America/Costa_Rica";

export function formatOpsDateTime(
  iso: string,
  options?: Pick<Intl.DateTimeFormatOptions, "dateStyle" | "timeStyle">,
): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: WEEON_OPS_TIME_ZONE,
      dateStyle: options?.dateStyle ?? "medium",
      timeStyle: options?.timeStyle ?? "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatOpsDateTimeNullable(iso: string | null | undefined): string {
  if (!iso) return "Never";
  return formatOpsDateTime(iso);
}

/** Short hint under activity filters. */
export const OPS_TIMEZONE_LABEL = "Times shown in Costa Rica (UTC−6)";
