/**
 * Hub card chrome — keep in sync with `weeon-tenants/lib/dashboard/hub-tones.ts`
 * (Community / dashboard shortcut tiles: `border border-border` + tone ring).
 */

export type HubTone = "blue" | "purple" | "yellow" | "green";

export const DASHBOARD_PANEL_BORDER = "rounded-xl border border-border/80 bg-surface";

export const DASHBOARD_PANEL_SHELL = `overflow-hidden ${DASHBOARD_PANEL_BORDER}`;

const HUB_TONE_CARD: Record<HubTone, string> = {
  blue: "bg-surface",
  purple: "bg-surface",
  yellow: "bg-surface",
  green: "bg-surface",
};

const HUB_TONE_PILL_RING: Record<HubTone, string> = {
  blue: "shadow-sm ring-1 ring-[#9ec5eb]/70 dark:ring-[#2a5080]/80",
  purple: "shadow-sm ring-1 ring-[#c4b0ef]/70 dark:ring-[#5b4a9a]/80",
  yellow: "shadow-sm ring-1 ring-[#f5d88a]/70 dark:ring-[#8a6b2a]/80",
  green: "shadow-sm ring-1 ring-[#7dd3c7]/70 dark:ring-[#2a6b62]/80",
};

export function hubTonePill(tone: HubTone) {
  return {
    active: `${HUB_TONE_CARD[tone]} ${HUB_TONE_PILL_RING[tone]}`,
  };
}

/** Large school hero / hub tiles — same chrome as ERP `ModuleTile`. */
export function dashboardHubCardClass(
  tone: HubTone = "blue",
  rounded: "xl" | "2xl" = "2xl",
): string {
  const radius = rounded === "2xl" ? "rounded-2xl" : "rounded-xl";
  return `${radius} border border-border ${hubTonePill(tone).active}`;
}
