"use client";

import { useActionState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import {
  setParentPaymentsAddonAction,
  type ParentPaymentsAddonActionState,
} from "@/lib/dashboard/tenant-addon-actions";
import type { ParentPaymentsAddonStatus } from "@/lib/platform/parent-payments-addon";

export function ParentPaymentsAddonCard({
  tenantId,
  status,
}: {
  tenantId: string;
  status: ParentPaymentsAddonStatus;
}) {
  const [state, action, pending] = useActionState<
    ParentPaymentsAddonActionState,
    FormData
  >(setParentPaymentsAddonAction, null);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
        <CreditCard size={16} className="text-foreground/45" aria-hidden />
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/60">
          Parent payments add-on
        </h2>
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/50">Add-on</dt>
            <dd className="font-semibold text-foreground">
              {status.enabled ? "Enabled" : "Disabled"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/50">School GreenPay</dt>
            <dd className="font-semibold text-foreground">
              {status.paymentsReady ? "Connected" : "Not connected"}
            </dd>
          </div>
          {status.enabledAt ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/50">Enabled at</dt>
              <dd className="font-semibold text-foreground">
                {new Date(status.enabledAt).toLocaleString()}
              </dd>
            </div>
          ) : null}
        </dl>

        <p className="text-xs text-foreground/55">
          Enables <strong>Cobros a encargados</strong> in the school ERP and{" "}
          <strong>Pagos</strong> in the parent mobile app. School admin connects
          GreenPay in Configuración — ops does not store merchant secrets here.
        </p>

        <form action={action} className="flex flex-wrap gap-2 pt-1">
          <input type="hidden" name="tenantId" value={tenantId} />
          <input type="hidden" name="enabled" value={status.enabled ? "false" : "true"} />
          <button
            type="submit"
            disabled={pending}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              status.enabled ? "bg-foreground/70 hover:bg-foreground/80" : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : null}
            {status.enabled ? "Disable add-on" : "Enable add-on"}
          </button>
        </form>

        {state?.ok ? <p className="text-sm font-medium text-success">{state.ok}</p> : null}
        {state?.error ? <p className="text-sm font-medium text-error">{state.error}</p> : null}
      </div>
    </div>
  );
}
