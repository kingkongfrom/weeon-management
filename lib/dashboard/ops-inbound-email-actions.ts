"use server";

import { revalidatePath } from "next/cache";
import { getPlatformSession } from "@/lib/auth/session";
import { markInboundEmailRead } from "@/lib/platform/inbound-email";

export async function markOpsInboundReadAction(
  inboundId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await getPlatformSession();
  if (!user) return { ok: false, error: "Your session expired. Sign in again." };

  const result = await markInboundEmailRead(inboundId);
  if (result.ok) {
    revalidatePath("/dashboard/email");
  }
  return result;
}
