import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginShell } from "@/components/auth/login-form";
import { getPlatformSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user } = await getPlatformSession();
  if (user) {
    redirect("/dashboard");
  }
  return <LoginShell />;
}
