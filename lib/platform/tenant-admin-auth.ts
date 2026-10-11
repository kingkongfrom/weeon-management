import "server-only";

import { createPlatformClient } from "@/lib/supabase/platform";
import { listTenantAdmins } from "@/lib/platform/metrics";

export type TenantAdminLoginSignal = {
  id: string;
  name: string;
  email: string;
  lastSignInAt: string | null;
};

/** Supabase Auth `last_sign_in_at` per school admin (historical; not every session). */
export async function listTenantAdminLoginSignals(
  tenantId: string,
): Promise<TenantAdminLoginSignal[]> {
  const admins = await listTenantAdmins(tenantId);
  if (admins.length === 0) return [];

  const client = createPlatformClient();
  const signals = await Promise.all(
    admins.map(async (admin) => {
      let lastSignInAt: string | null = null;
      try {
        const { data, error } = await client.auth.admin.getUserById(admin.id);
        if (!error) {
          lastSignInAt = data.user?.last_sign_in_at ?? null;
        }
      } catch {
        /* best-effort */
      }
      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        lastSignInAt,
      };
    }),
  );

  return signals.sort((a, b) => {
    const ta = a.lastSignInAt ? Date.parse(a.lastSignInAt) : 0;
    const tb = b.lastSignInAt ? Date.parse(b.lastSignInAt) : 0;
    return tb - ta;
  });
}
