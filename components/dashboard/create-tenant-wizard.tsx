"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  School,
  Search,
  UserPlus,
} from "lucide-react";
import {
  createDemoTenantAction,
  previewSchoolAction,
  type PreviewState,
} from "@/lib/dashboard/provisioning-actions";
import type { CreateDemoTenantResult } from "@/lib/platform/provisioning";
import {
  ADMIN_ROLES,
  DEFAULT_SCHOOL_COUNTRY,
  getSchoolCountry,
  SCHOOL_COUNTRIES,
} from "@/lib/platform/school-countries";

type PreviewData = Extract<PreviewState, { status: "ok" }>["data"];
type CreatedData = Extract<CreateDemoTenantResult, { ok: true }>;

const FIELD =
  "h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition-all focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60";
const LABEL = "text-xs font-semibold uppercase tracking-wider text-foreground/55";
const PRIMARY =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-600 bg-brand-600 px-5 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";
const SECONDARY =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground/70 transition-colors hover:bg-surface-muted disabled:opacity-60";

export function CreateTenantWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [country, setCountry] = useState(DEFAULT_SCHOOL_COUNTRY);
  const [saberCode, setSaberCode] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminRole, setAdminRole] = useState<string>(ADMIN_ROLES[0].value);
  const [schoolNameOverride, setSchoolNameOverride] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedData | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedCountry = getSchoolCountry(country) ?? SCHOOL_COUNTRIES[0];

  function lookup() {
    setError(null);
    startTransition(async () => {
      const result = await previewSchoolAction(country, saberCode);
      if (result.status !== "ok") {
        setError(result.status === "error" ? result.error : "Lookup failed.");
        return;
      }
      setPreview(result.data);
      setSchoolNameOverride(result.data.preview.name);
      setStep(2);
    });
  }

  function create() {
    if (!preview) return;
    setError(null);
    startTransition(async () => {
      const result = await createDemoTenantAction({
        country,
        schoolCode: preview.preview.saberCode,
        name: schoolNameOverride.trim() || preview.preview.name,
        adminFirstName: firstName,
        adminLastName: lastName,
        adminEmail,
        adminRole,
      });
      if (result.status !== "ok") {
        setError(result.status === "error" ? result.error : "Creation failed.");
        return;
      }
      setCreated(result.data);
      setStep(3);
    });
  }

  if (created) {
    return <SuccessPanel data={created} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <Stepper step={step} />

      {error ? (
        <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
              <Search size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Institución</h2>
              <p className="text-sm font-medium text-foreground/60">
                Elija el país y busque la institución por su código oficial.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-2 sm:w-[163px]">
              <label className={LABEL} htmlFor="country">
                País
              </label>
              <CountrySelect
                value={country}
                onChange={(code) => {
                  setCountry(code);
                  setSaberCode("");
                  setError(null);
                }}
              />
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <label className={LABEL} htmlFor="schoolCode">
                {selectedCountry.codeLabel}
              </label>
              <input
                id="schoolCode"
                value={saberCode}
                onChange={(event) => setSaberCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && saberCode.trim()) lookup();
                }}
                placeholder={selectedCountry.codePlaceholder}
                aria-label={selectedCountry.codeLabel}
                className={FIELD}
              />
            </div>

            <button
              type="button"
              onClick={lookup}
              disabled={pending || !saberCode.trim() || !selectedCountry.supported}
              className={`${PRIMARY} shrink-0`}
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Buscar
            </button>
          </div>

          {!selectedCountry.supported ? (
            <p className="mt-3 text-xs font-medium text-foreground/55">
              {selectedCountry.name} aún no está disponible. Por ahora solo Costa
              Rica.
            </p>
          ) : null}
        </section>
      ) : null}

      {step === 2 && preview ? (
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
              <School size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-foreground">
                {preview.preview.name}
              </h2>
              <p className="text-sm font-medium text-foreground/60">
                {preview.preview.locationLabel || preview.preview.saberCode}
              </p>
            </div>
          </div>

          {preview.alreadyClaimed ? (
            <p className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
              Esta institución ya tiene un espacio creado. No se puede crear otro.
            </p>
          ) : null}

          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Fact label={selectedCountry.codeLabel} value={preview.preview.saberCode} />
            <Fact label="Horario" value={preview.preview.scheduleLabel} />
            <Fact
              label="Ciclos"
              value={preview.preview.cycleLabels.join(", ") || "—"}
            />
            <Fact
              label="Grados"
              value={preview.preview.gradeLabels.join(", ") || "—"}
            />
          </dl>

          <div className="mt-4 flex flex-col gap-2">
            <label className={LABEL} htmlFor="schoolName">
              Nombre del colegio
            </label>
            <input
              id="schoolName"
              value={schoolNameOverride}
              onChange={(event) => setSchoolNameOverride(event.target.value)}
              className={FIELD}
            />
            <p className="text-xs font-medium text-foreground/50">
              Puede editarlo antes de crear el espacio.
            </p>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Cuenta del administrador
                </h3>
                <p className="text-sm font-medium text-foreground/60">
                  El administrador creará su contraseña en el primer ingreso.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className={LABEL} htmlFor="firstName">
                  Nombre
                </label>
                <input
                  id="firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className={FIELD}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={LABEL} htmlFor="lastName">
                  Apellidos
                </label>
                <input
                  id="lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className={FIELD}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={LABEL} htmlFor="adminRole">
                  Cargo
                </label>
                <select
                  id="adminRole"
                  value={adminRole}
                  onChange={(event) => setAdminRole(event.target.value)}
                  className={FIELD}
                >
                  {ADMIN_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className={LABEL} htmlFor="adminEmail">
                  Correo del administrador
                </label>
                <input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  placeholder="admin@colegio.cr"
                  className={FIELD}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className={SECONDARY}
            >
              <ArrowLeft size={16} />
              Atrás
            </button>
            <button
              type="button"
              onClick={create}
              disabled={
                pending ||
                preview.alreadyClaimed ||
                !firstName.trim() ||
                !lastName.trim() ||
                !adminEmail.trim()
              }
              className={PRIMARY}
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : null}
              Crear espacio de demostración
            </button>
          </div>

          <p className="mt-3 text-xs font-medium text-foreground/55">
            Se crea con acceso completo por 3 días. Después pasa a solo lectura
            hasta que la institución active su suscripción.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { id: 1, label: "Código SABER" },
    { id: 2, label: "Colegio y administrador" },
    { id: 3, label: "Listo" },
  ] as const;

  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold">
      {items.map((item, index) => {
        const active = item.id === step;
        const done = item.id < step;
        return (
          <li key={item.id} className="flex items-center gap-2">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full ${
                active || done
                  ? "bg-brand-600 text-white"
                  : "bg-surface-muted text-foreground/45"
              }`}
            >
              {done ? <Check size={13} /> : item.id}
            </span>
            <span className={active ? "text-foreground" : "text-foreground/50"}>
              {item.label}
            </span>
            {index < items.length - 1 ? (
              <span className="mx-1 h-px w-6 bg-border" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function CountryFlag({ code, className = "" }: { code: string; className?: string }) {
  const flags: Record<string, ReactNode> = {
    CR: (
      <>
        <rect width="21" height="15" fill="#002b7f" />
        <rect y="3" width="21" height="9" fill="#ffffff" />
        <rect y="4.5" width="21" height="6" fill="#ce1126" />
      </>
    ),
    MX: (
      <>
        <rect width="21" height="15" fill="#ffffff" />
        <rect width="7" height="15" fill="#006847" />
        <rect x="14" width="7" height="15" fill="#ce1126" />
      </>
    ),
    CL: (
      <>
        <rect width="21" height="15" fill="#ffffff" />
        <rect y="7.5" width="21" height="7.5" fill="#d52b1e" />
        <rect width="7" height="7.5" fill="#0039a6" />
      </>
    ),
    PE: (
      <>
        <rect width="21" height="15" fill="#ffffff" />
        <rect width="7" height="15" fill="#d91023" />
        <rect x="14" width="7" height="15" fill="#d91023" />
      </>
    ),
    CO: (
      <>
        <rect width="21" height="15" fill="#fcd116" />
        <rect y="7.5" width="21" height="3.75" fill="#003893" />
        <rect y="11.25" width="21" height="3.75" fill="#ce1126" />
      </>
    ),
    GT: (
      <>
        <rect width="21" height="15" fill="#ffffff" />
        <rect width="7" height="15" fill="#4997d0" />
        <rect x="14" width="7" height="15" fill="#4997d0" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 21 15"
      role="img"
      aria-hidden
      className={`h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10 ${className}`}
    >
      {flags[code] ?? <rect width="21" height="15" fill="#cbd5e1" />}
    </svg>
  );
}

function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = getSchoolCountry(value) ?? SCHOOL_COUNTRIES[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id="country"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${FIELD} flex items-center justify-between gap-2 text-left`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CountryFlag code={selected.code} />
          <span className="truncate">{selected.name}</span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-foreground/45 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="País"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg"
        >
          {SCHOOL_COUNTRIES.map((item) => {
            const active = item.code === value;
            return (
              <li key={item.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(item.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                      : "text-foreground/80 hover:bg-surface-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CountryFlag code={item.code} />
                    {item.name}
                  </span>
                  {active ? <Check size={15} /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function SuccessPanel({ data }: { data: CreatedData }) {
  const ends = new Date(data.demoEndsAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="rounded-2xl border border-success/30 bg-success/5 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-success text-white">
          <Check size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Espacio creado
          </h2>
          <p className="text-sm font-medium text-foreground/60">
            {data.tenantName}
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-foreground/50">Subdominio</dt>
          <dd className="font-semibold text-foreground">{data.slug}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-foreground/50">Administrador</dt>
          <dd className="font-semibold text-foreground">{data.adminEmail}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-foreground/50">Demo termina</dt>
          <dd className="font-semibold text-foreground">{ends}</dd>
        </div>
      </dl>

      <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-foreground/65">
        El administrador debe entrar a{" "}
        <strong className="text-foreground">app.weeon.school</strong>, usar{" "}
        <em>«¿Primera vez? Cree su contraseña»</em> y crear su contraseña. No se
        envía ninguna contraseña por correo.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/dashboard/tenants/${data.tenantId}`} className={PRIMARY}>
          Ver el colegio
        </Link>
        <Link href="/dashboard/onboarding" className={SECONDARY}>
          Crear otro
        </Link>
      </div>
    </section>
  );
}
