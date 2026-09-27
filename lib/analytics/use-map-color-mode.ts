"use client";

import { useEffect, useState } from "react";

export type MapColorMode = "light" | "dark";

/** Reads the dashboard `dark` class and keeps the map in sync with the toggle. */
export function useMapColorMode(): MapColorMode {
  const [mode, setMode] = useState<MapColorMode>("light");

  useEffect(() => {
    const root = document.documentElement;
    const read = () =>
      setMode(root.classList.contains("dark") ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return mode;
}
