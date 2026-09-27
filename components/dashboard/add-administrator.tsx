"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, UserPlus } from "lucide-react";
import { addAdministratorAction } from "@/lib/dashboard/provisioning-actions";

export function AddAdministrator({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await addAdministratorAction({
        tenantId,
        adminFirstName: firstName,
        adminLastName: lastName,
        adminEmail: email,
      });
      if (result.status !== "ok") {
        setError(result.status === "error" ? result.error : "No se pudo agregar.");
        return;
      }
      setDone(result.email);
      setFirstName("");
      setLastName("");
      setEmail("");
      setOpen(false);
    });
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
        <Check size={13} />
        Administrador agregado ({done})
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground/70 transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <UserPlus size={13} />
        Agregar administrador
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Nombre"
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/15"
        />
        <input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          placeholder="Apellidos"
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/15"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="correo@colegio.cr"
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/15 sm:col-span-2"
        />
      </div>

      {error ? (
        <p className="text-xs font-medium text-error">{error}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={
            pending || !firstName.trim() || !lastName.trim() || !email.trim()
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
          Crear
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={pending}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground/60 transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>

      <p className="text-[11px] font-medium text-foreground/50">
        El administrador creará su contraseña en el primer ingreso.
      </p>
    </div>
  );
}
