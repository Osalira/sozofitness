import { Resend } from "resend";

/**
 * Feature flag: Email sending enabled
 */
export const EMAIL_ENABLED = !!(
  process.env.EMAIL_PROVIDER &&
  process.env.EMAIL_PROVIDER !== "__PLACEHOLDER__" &&
  process.env.RESEND_API_KEY &&
  process.env.RESEND_API_KEY !== "__PLACEHOLDER__"
);

const resend = EMAIL_ENABLED ? new Resend(process.env.RESEND_API_KEY) : null;

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

/**
 * Email sender abstraction
 */
export class EmailSender {
  private static fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@sozofitness.com";

  /**
   * Send an email via Resend
   */
  static async send(params: SendEmailParams): Promise<SendEmailResult> {
    const { to, subject, text, html } = params;

    if (!EMAIL_ENABLED || !resend) {
      console.log("📧 [EMAIL NOT CONFIGURED] Would send email:");
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Body: ${text}`);
      return {
        success: false,
        error: "Email provider not configured. Set RESEND_API_KEY in .env",
      };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        text,
        html: html || text.replace(/\n/g, "<br>"),
      });

      if (error) {
        console.error("Failed to send email:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log(`✅ Email sent to ${to}: ${subject}`);

      return {
        success: true,
        providerMessageId: data?.id,
      };
    } catch (error: any) {
      console.error("Failed to send email:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send appointment reminder email
   */
  static async sendAppointmentReminder(params: {
    to: string;
    recipientName: string;
    coachName: string;
    appointmentTime: string;
    productName: string;
    zoomJoinUrl?: string | null;
    timeUntil: string; // "5 days" or "24 hours"
    locale?: "en" | "fr"; // User's preferred locale
  }): Promise<SendEmailResult> {
    const {
      to,
      recipientName,
      coachName,
      appointmentTime,
      productName,
      zoomJoinUrl,
      timeUntil,
      locale = "en",
    } = params;

    // Use localized email template
    const { getAppointmentReminderEmail } = await import("@/lib/i18n/email-templates");
    const { subject, text, html } = getAppointmentReminderEmail({
      locale,
      recipientName,
      coachName,
      appointmentTime,
      productName,
      zoomJoinUrl,
      timeUntil,
    });

    return await this.send({ to, subject, text, html });
  }
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return EMAIL_ENABLED;
}
