import type { Metadata } from "next";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

export const metadata: Metadata = {
  title: "Accept invitation",
};

export default function AcceptInvitePage() {
  return <AcceptInviteForm />;
}
