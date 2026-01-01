import twilio from "twilio";

/**
 * Feature flag: SMS sending enabled
 * TODO: Manual Twilio Setup Required
 * 1. Create Twilio account: https://www.twilio.com/try-twilio
 * 2. Buy a phone number in Twilio Console
 * 3. Get Account SID and Auth Token from Console
 * 4. Add to .env:
 *    SMS_PROVIDER=twilio
 *    TWILIO_ACCOUNT_SID=your_account_sid
 *    TWILIO_AUTH_TOKEN=your_auth_token
 *    TWILIO_FROM_NUMBER=+1234567890
 */
export const SMS_ENABLED = !!(
  process.env.SMS_PROVIDER === "twilio" &&
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_FROM_NUMBER &&
  process.env.TWILIO_ACCOUNT_SID !== "__PLACEHOLDER__"
);

export interface SendSmsParams {
  to: string; // E.164 format: +1234567890
  message: string;
}

export interface SendSmsResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

/**
 * SMS sender abstraction
 */
export class SmsSender {
  private static twilioClient = SMS_ENABLED
    ? twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
    : null;

  private static fromNumber = process.env.TWILIO_FROM_NUMBER || "";

  /**
   * Send an SMS via Twilio
   */
  static async send(params: SendSmsParams): Promise<SendSmsResult> {
    const { to, message } = params;

    if (!SMS_ENABLED) {
      console.log("📱 [SMS NOT CONFIGURED] Would send SMS:");
      console.log(`   To: ${to}`);
      console.log(`   Message: ${message}`);
      return {
        success: false,
        error: "SMS provider not configured. Set TWILIO credentials in .env",
      };
    }

    // Validate E.164 format
    if (!to.match(/^\+[1-9]\d{1,14}$/)) {
      return {
        success: false,
        error: "Invalid phone number format. Must be E.164 format (e.g., +16045551234)",
      };
    }

    try {
      const twilioMessage = await this.twilioClient!.messages.create({
        body: message,
        from: this.fromNumber,
        to,
      });

      console.log(`✅ SMS sent to ${to} (SID: ${twilioMessage.sid})`);

      return {
        success: true,
        providerMessageId: twilioMessage.sid,
      };
    } catch (error: any) {
      console.error("Failed to send SMS:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send appointment reminder SMS
   */
  static async sendAppointmentReminder(params: {
    to: string;
    recipientName: string;
    coachName: string;
    appointmentTime: string;
    zoomJoinUrl?: string | null;
    timeUntil: string; // "5 days" or "24 hours"
  }): Promise<SendSmsResult> {
    const { to, recipientName, coachName, appointmentTime, zoomJoinUrl, timeUntil } = params;

    // Keep SMS short (160 chars ideal, 320 max for compatibility)
    let message = `Hi ${recipientName}, reminder: Coaching session with ${coachName} in ${timeUntil} at ${appointmentTime}.`;

    if (zoomJoinUrl) {
      message += ` Join: ${zoomJoinUrl}`;
    }

    message += ` Reply STOP to opt out.`;

    return await this.send({ to, message });
  }
}

/**
 * Check if SMS is configured
 */
export function isSmsConfigured(): boolean {
  return SMS_ENABLED;
}

/**
 * Validate E.164 phone number format
 */
export function validateE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}
