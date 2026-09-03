import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createPlatformClient } from "@/lib/supabase/platform";

async function getTenant(id: string) {
  const client = createPlatformClient();
  const { data, error } = await client
    .from("tenants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenant(id);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={tenant.status} />
          <span className="text-sm text-ink-2/50">{tenant.id}</span>
        </div>
      </div>

      <div className="card grid gap-px overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-3">
        <Cell k="Plan" v={tenant.plan ?? "—"} />
        <Cell k="Subdomain" v={tenant.subdomain ?? "—"} />
        <Cell k="Código SABER" v={tenant.saber_code ?? "—"} />
        <Cell k="Billing seats" v={String(tenant.billing_seats)} />
        <Cell
          k="Trial window"
          v={formatRange(tenant.trial_started_at, tenant.trial_ends_at)}
        />
        <Cell
          k="Paid until"
          v={fmtDate(tenant.paid_until)}
        />
        <Cell k="Created" v={fmtDate(tenant.created_at)} />
        <Cell k="Updated" v={fmtDate(tenant.updated_at)} />
      </div>
    </div>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-white p-4">
      <dt className="text-xs uppercase tracking-wide text-ink-2/50">{k}</dt>
      <dd className="mt-1 text-sm font-medium">{v}</dd>
    </div>
  );
}

function fmtDate(iso?: string | null) {
  return iso ? new Date(iso).toISOString().slice(0, 16).replace("T", " ") : "—";
}

function formatRange(a?: string | null, b?: string | null) {
  if (!a && !b) return "—";
  return `${fmtDate(a)} → ${fmtDate(b)}`;
}
