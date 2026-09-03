import type { Metadata } from "next";
import { DashboardNav } from "@/components/DashboardNav";

export const metadata: Metadata = {
  title: "Dashboard · Weeon Management",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <DashboardNav />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
