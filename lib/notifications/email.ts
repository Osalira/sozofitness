import sgMail from "@sendgrid/mail";

/**
 * Feature flag: Email sending enabled
 */
export const EMAIL_ENABLED = !!(
  process.env.EMAIL_PROVIDER &&
  process.env.EMAIL_PROVIDER !== "__PLACEHOLDER__" &&
  process.env.SENDGRID_API_KEY &&
  process.env.SENDGRID_API_KEY !== "__PLACEHOLDER__"
);

// Initialize SendGrid if configured
if (EMAIL_ENABLED && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

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
  private static fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@sozofitness.com";

  /**
   * Send an email via SendGrid
   */
  static async send(params: SendEmailParams): Promise<SendEmailResult> {
    const { to, subject, text, html } = params;

    if (!EMAIL_ENABLED) {
      console.log("📧 [EMAIL NOT CONFIGURED] Would send email:");
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Body: ${text}`);
      return {
        success: false,
        error: "Email provider not configured. Set SENDGRID_API_KEY in .env",
      };
    }

    try {
      const msg = {
        to,
        from: this.fromEmail,
        subject,
        text,
        html: html || text.replace(/\n/g, "<br>"),
      };

      const [response] = await sgMail.send(msg);

      console.log(`✅ Email sent to ${to}: ${subject}`);

      return {
        success: true,
        providerMessageId: response.headers["x-message-id"] as string,
      };
    } catch (error: any) {
      console.error("Failed to send email:", error.response?.body || error.message);
      return {
        success: false,
        error: error.response?.body?.errors?.[0]?.message || error.message,
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
