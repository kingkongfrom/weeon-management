import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth/policy";

/** Short user-facing message when the email is outside the staff domain. */
export function isAllowedStaffEmailDomainError(): string {
  return `Only @${ALLOWED_EMAIL_DOMAIN} staff can access the ops console.`;
}
