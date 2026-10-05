import "server-only";

import { brandedEmailHtml, brandedEmailText, escapeHtml } from "@/lib/email/layout";
import { sendBrandedEmail, type EmailSendResult } from "@/lib/email/send";
import {
  DELINQUENCY_GRACE_DAYS,
  type SuspendReason,
} from "@/lib/platform/tenant-status";

const SUPPORT_EMAIL = "support@weeon.school";

/**
 * Notify a school's administrators that Weeon Ops has suspended access.
 *
 * The body depends on *why*: a payment hold points at billing, a manual hold
 * points at support and never mentions money. This is the only surface where
 * the reason is stated — teachers, students, and guardians are never told, and
 * nothing here may mention a trial (Weeon no longer sells trials).
 */
export function buildSchoolSuspensionEmail(input: {
  reason: SuspendReason;
  /** ISO date for the delinquency grace end, when applicable. */
  readOnlyAt: string | null;
}): { subject: string; text: string; html: string } {
  const delinquency = input.reason === "delinquency";

  const readOnlyLine = formatReadOnlyLine(input.readOnlyAt);

  const subject = delinquency
    ? "Pago pendiente — acceso de Weeon School"
    : "Acceso en pausa — Weeon School";

  const paymentIntro = `<p style="margin:0;color:#3a4360;font-size:15px;line-height:1.6;">
      La suscripción de su institución tiene un <strong>pago pendiente</strong>.
      ${readOnlyLine}
    </p>
    <p style="margin:14px 0 0;color:#3a4360;font-size:15px;line-height:1.6;">
      Realice el pago para restablecer el acceso completo al panel.
    </p>`;

  const manualIntro = `<p style="margin:0;color:#3a4360;font-size:15px;line-height:1.6;">
      El acceso de su institución al panel quedó <strong>en pausa</strong> por parte del equipo de Weeon.
    </p>
    <p style="margin:14px 0 0;color:#3a4360;font-size:15px;line-height:1.6;">
      Comuníquese con soporte para revisar el estado de su cuenta y restablecer el acceso.
    </p>`;

  const footer = delinquency
    ? "Si ya realizó el pago, ignore este mensaje; el acceso se restablece automáticamente."
    : `¿Dudas? Escriba a ${SUPPORT_EMAIL}.`;

  return {
    subject,
    text: brandedEmailText(
      delinquency
        ? [
            "Hola.",
            "",
            "La suscripción de su institución tiene un pago pendiente.",
            readOnlyLinePlain(input.readOnlyAt),
            "",
            "Realice el pago para restablecer el acceso completo al panel.",
            "",
            footer,
          ]
        : [
            "Hola.",
            "",
            "El acceso de su institución al panel quedó en pausa por parte del equipo de Weeon.",
            "",
            "Comuníquese con soporte para revisar el estado de su cuenta y restablecer el acceso.",
            "",
            footer,
          ],
    ),
    html: brandedEmailHtml({
      lang: "es",
      title: delinquency ? "Pago pendiente" : "Acceso en pausa",
      greeting: "Hola.",
      intro: delinquency ? paymentIntro : manualIntro,
      buttonLabel: delinquency ? "Ir a facturación" : "Contactar a soporte",
      buttonUrl: delinquency
        ? process.env.WEEON_APP_ORIGIN
          ? `${process.env.WEEON_APP_ORIGIN.replace(/\/$/, "")}/dashboard/billing`
          : "https://app.weeon.school/dashboard/billing"
        : `mailto:${SUPPORT_EMAIL}`,
      footer,
    }),
  };
}

function formatReadOnlyLine(readOnlyAt: string | null): string {
  if (!readOnlyAt) return "";
  return `El acceso de edición se suspende el <strong>${escapeHtml(formatDate(readOnlyAt))}</strong>.`;
}

function readOnlyLinePlain(readOnlyAt: string | null): string {
  if (!readOnlyAt) return "";
  return `El acceso de edición se suspende el ${formatDate(readOnlyAt)}.`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Grace days for the delinquency hold, exported for UI copy reuse. */
export const SUSPENSION_GRACE_DAYS = DELINQUENCY_GRACE_DAYS;

export async function sendSchoolSuspensionEmail(input: {
  to: string[];
  reason: SuspendReason;
  readOnlyAt: string | null;
}): Promise<EmailSendResult> {
  const message = buildSchoolSuspensionEmail({
    reason: input.reason,
    readOnlyAt: input.readOnlyAt,
  });
  // sendBrandedEmail takes one recipient; the ops console has a 3-admin cap, so
  // send individually and report the first failure.
  let lastId = "";
  for (const email of input.to) {
    const result = await sendBrandedEmail({
      to: email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    if (!result.success) return result;
    lastId = result.id;
  }
  return { success: true, id: lastId };
}
