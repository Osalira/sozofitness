import { translate } from "./translations";
import type { Locale } from "./config";

export function getAppointmentReminderEmail(params: {
  locale: Locale;
  recipientName: string;
  coachName: string;
  appointmentTime: string;
  productName: string;
  zoomJoinUrl?: string | null;
  timeUntil: string;
}): { subject: string; text: string; html: string } {
  const { locale, recipientName, coachName, appointmentTime, productName, zoomJoinUrl, timeUntil } =
    params;

  const t = (key: string, params?: Record<string, string>) => translate(locale, key, params);

  const subject = t("email.appointmentReminder.subject", { timeUntil });

  const text = `${t("email.appointmentReminder.greeting", { name: recipientName })}

${t("email.appointmentReminder.intro", { timeUntil })}

${t("email.appointmentReminder.sessionDetails")}
- ${t("email.appointmentReminder.coach")}: ${coachName}
- ${t("email.appointmentReminder.product")}: ${productName}
- ${t("email.appointmentReminder.time")}: ${appointmentTime}
${
  zoomJoinUrl
    ? `\n${t("email.appointmentReminder.zoomLink")}\n${zoomJoinUrl}`
    : `\n${t("email.appointmentReminder.zoomPending")}`
}

${t("email.appointmentReminder.lookingForward")}

${t("email.appointmentReminder.signature")}

---
${t("email.appointmentReminder.managePreferences")}`;

  const html = text.replace(/\n/g, "<br>");

  return { subject, text, html };
}

