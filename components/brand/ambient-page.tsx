import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

export function AmbientBackdrop() {
  return <div className="login-bg-glow" aria-hidden />;
}

/** Login chrome: navy field, logo, then the form. */
export function AmbientPage({ children }: { children: ReactNode }) {
  return (
    <div className="login-bg relative flex min-h-screen flex-col">
      <AmbientBackdrop />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-5">
        <div className="mb-8 self-center">
          <Logo className="login-logo" />
        </div>
        {children}
      </main>
    </div>
  );
}
