"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { AmbientPage } from "@/components/brand/ambient-page";
import {
  acceptInviteAction,
  validateInviteToken,
} from "@/lib/auth/invite-actions";

type Check = { id: string; label: string; test: (p: string) => boolean };
const REQUIREMENTS: Check[] = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "number", label: "One number", test: (p) => /[0-9]/.test(p) },
  { id: "symbol", label: "One symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="brand-gradient inline-flex h-10 w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Set password and join"}
    </button>
  );
}

function SetPasswordCard({ token }: { token: string }) {
  const [state, formAction] = useActionState(acceptInviteAction, null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  return (
    <div className="login-card rounded-2xl p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Join Weeon Ops</h1>
      <p className="mt-2 text-sm">
        Choose a password for the Weeon operations console. This is not a school
        administrator account.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-semibold">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="login-field h-8 w-full rounded-lg border px-2.5 pr-10 text-sm outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShow((prev) => !prev)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/50 transition-colors hover:text-white"
            >
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {password.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {REQUIREMENTS.map((req) => {
                const met = req.test(password);
                return (
                  <li
                    key={req.id}
                    className={`flex items-center gap-1.5 text-xs ${
                      met ? "text-emerald-400" : "text-white/50"
                    }`}
                  >
                    <span
                      className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[9px] ${
                        met
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-white/40"
                      }`}
                    >
                      {met ? "✓" : "•"}
                    </span>
                    {req.label}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        {state?.error ? (
          <div className="rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
            {state.error}
          </div>
        ) : null}

        <SubmitButton />
      </form>
    </div>
  );
}

function InviteController() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<
    | { status: "pending" }
    | { status: "error"; error: string }
    | { status: "ready"; token: string }
  >({ status: "pending" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const run = async () => {
      if (!token) {
        setState({ status: "error", error: "This invitation link is invalid or missing." });
        return;
      }
      const res = await validateInviteToken(token);
      if (!res.ok) {
        setState({
          status: "error",
          error: res.error ?? "This invitation link is invalid or expired.",
        });
        return;
      }
      setState({ status: "ready", token });
    };
    void run();
  }, [token]);

  if (state.status === "ready") {
    return (
      <AmbientPage>
        <SetPasswordCard token={state.token} />
      </AmbientPage>
    );
  }

  if (state.status === "error") {
    return (
      <AmbientPage>
        <div className="login-card rounded-2xl p-6 text-center sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">Invitation invalid</h1>
          <p className="mt-2 text-sm">{state.error}</p>
          <Link
            href="/"
            className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            Back to sign in
          </Link>
        </div>
      </AmbientPage>
    );
  }

  return (
    <AmbientPage>
      <div className="login-card rounded-2xl p-6 text-center sm:p-8">
        <p className="text-sm">Checking your invitation…</p>
      </div>
    </AmbientPage>
  );
}

export function AcceptInviteForm() {
  return (
    <Suspense
      fallback={
        <AmbientPage>
          <div className="login-card rounded-2xl p-6 text-center sm:p-8">
            <p className="text-sm">…</p>
          </div>
        </AmbientPage>
      }
    >
      <InviteController />
    </Suspense>
  );
}
