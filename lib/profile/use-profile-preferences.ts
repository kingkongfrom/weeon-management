"use client";

import { useSyncExternalStore } from "react";
import {
  PROFILE_AVATAR_STORAGE_KEY,
  readAvatarPreference,
} from "@/lib/profile/preferences";

/**
 * Shared subscription so every consumer of the avatar preference (header
 * avatar, account drawer) re-renders when it changes in the same tab. Mirrors
 * the theme preference store in `lib/theme/theme.ts`.
 */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === PROFILE_AVATAR_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Notify same-tab subscribers after an avatar write. */
export function emitProfilePreferences() {
  for (const listener of listeners) listener();
}

export function useAvatarPreference(): string {
  return useSyncExternalStore(subscribe, readAvatarPreference, () => "");
}
