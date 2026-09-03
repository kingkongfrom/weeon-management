import "server-only";

import { cookies } from "next/headers";
import {
  parseThemePreference,
  THEME_COOKIE_KEY,
  THEME_DARK_BG,
  THEME_LIGHT_BG,
  type ThemePreference,
} from "@/lib/theme/theme";

export async function getRequestTheme(): Promise<ThemePreference> {
  const store = await cookies();
  return parseThemePreference(store.get(THEME_COOKIE_KEY)?.value);
}

export function themeBackground(theme: ThemePreference): string {
  return theme === "dark" ? THEME_DARK_BG : THEME_LIGHT_BG;
}
