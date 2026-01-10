import { translate } from "./translations";
import type { Locale } from "./config";

export function getAppointmentReminderSms(params: {
  locale: Locale;
  recipientName: string;
  coachName: string;
  appointmentTime: string;
  zoomJoinUrl?: string | null;
  timeUntil: string;
}): string {
  const { locale, recipientName, coachName, appointmentTime, zoomJoinUrl, timeUntil } = params;

  const t = (key: string, params?: Record<string, string>) => translate(locale, key, params);

  let message: string;

  if (zoomJoinUrl) {
    message = t("sms.appointmentReminder", {
      name: recipientName,
      coach: coachName,
      timeUntil,
      time: appointmentTime,
      link: zoomJoinUrl,
    });
  } else {
    message = t("sms.appointmentReminderNoLink", {
      name: recipientName,
      coach: coachName,
      timeUntil,
      time: appointmentTime,
    });
  }

  message += ` ${t("sms.replyStop")}`;

  return message;
}

