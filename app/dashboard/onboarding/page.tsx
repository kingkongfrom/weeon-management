import type { Metadata } from "next";
import { CreateTenantWizard } from "@/components/dashboard/create-tenant-wizard";

export const metadata: Metadata = {
  title: "Onboarding",
};

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Onboarding
        </h1>
        <p className="text-sm font-medium text-foreground/60">
          Guided-demo onboarding: create the school space and its administrator
          account. The admin sets a password on first login.
        </p>
      </div>

      <CreateTenantWizard />
    </div>
  );
}
