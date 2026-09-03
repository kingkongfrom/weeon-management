import "server-only";

import { cookies } from "next/headers";
import { SIDEBAR_STORAGE_KEY } from "@/lib/dashboard/sidebar-key";

export async function getRequestSidebarCollapsed(): Promise<boolean> {
  const store = await cookies();
  return store.get(SIDEBAR_STORAGE_KEY)?.value === "1";
}
