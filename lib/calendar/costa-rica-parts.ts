import { WEEON_OPS_TIME_ZONE } from "@/lib/datetime/costa-rica";

/**
 * Civil date and clock time in Costa Rica for an instant.
 *
 * Client-safe on purpose: the meetings cards and the week strip both run in the
 * browser and must format dates exactly like the server rendered them.
 */
export function costaRicaParts(iso: string): { date: string; time: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: WEEON_OPS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(iso));
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = pick("hour") === "24" ? "00" : pick("hour");
  return {
    date: `${pick("year")}-${pick("month")}-${pick("day")}`,
    time: `${hour}:${pick("minute")}`,
  };
}
