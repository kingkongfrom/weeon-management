export const THEME_STORAGE_KEY = "weeon.ops.theme";
export const THEME_COOKIE_KEY = THEME_STORAGE_KEY;

export const THEME_LIGHT_BG = "#f4f6fa";
export const THEME_DARK_BG = "#1c2230";

export type ThemePreference = "light" | "dark";

export function parseThemePreference(value: string | null | undefined): ThemePreference {
  return value === "dark" ? "dark" : "light";
}

export function readThemePreference(): ThemePreference {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }
  if (typeof window === "undefined") return "light";
  return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
}

function persistThemeCookie(theme: ThemePreference) {
  document.cookie = `${THEME_COOKIE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  root.style.backgroundColor = theme === "dark" ? THEME_DARK_BG : THEME_LIGHT_BG;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  persistThemeCookie(theme);
}

export function toggleTheme(): ThemePreference {
  const next = readThemePreference() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

/** Blocking head script — keep in sync with THEME_STORAGE_KEY and sidebar key. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=${JSON.stringify("weeon.ops.sidebar.collapsed")};var darkBg=${JSON.stringify(THEME_DARK_BG)};var lightBg=${JSON.stringify(THEME_LIGHT_BG)};var cookie=document.cookie.split("; ").find(function(p){return p.indexOf(k+"=")==0});var theme=cookie?cookie.slice(k.length+1):localStorage.getItem(k);var dark=theme==="dark";var root=document.documentElement;root.classList.toggle("dark",dark);root.style.colorScheme=dark?"dark":"light";root.style.backgroundColor=dark?darkBg:lightBg;if(!cookie){document.cookie=k+"="+(dark?"dark":"light")+"; path=/; max-age=31536000; samesite=lax";}var sideCookie=document.cookie.split("; ").find(function(p){return p.indexOf(s+"=")==0});var collapsed=sideCookie?sideCookie.slice(s.length+1)==="1":localStorage.getItem(s)==="1";root.classList.toggle("sidebar-collapsed",collapsed);}catch(e){}})();`;
