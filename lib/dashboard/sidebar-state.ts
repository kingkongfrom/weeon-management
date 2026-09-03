"use client";

import { useSyncExternalStore } from "react";
import { SIDEBAR_STORAGE_KEY } from "@/lib/dashboard/sidebar-key";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function readSidebarCollapsed(): boolean {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("sidebar-collapsed");
  }
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
}

export function writeSidebarCollapsed(collapsed: boolean) {
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
  document.documentElement.classList.toggle("sidebar-collapsed", collapsed);
  document.cookie = `${SIDEBAR_STORAGE_KEY}=${collapsed ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  emit();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSidebarCollapsed(initialCollapsed = false) {
  return useSyncExternalStore(
    subscribe,
    readSidebarCollapsed,
    () => initialCollapsed,
  );
}
