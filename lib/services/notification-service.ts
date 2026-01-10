import { prisma } from "@/lib/prisma";
import { NotificationChannel, NotificationStatus } from "@prisma/client";
import { EmailSender } from "@/lib/notifications/email";
import { SmsSender } from "@/lib/notifications/sms";

export class NotificationService {
  /**
   * Schedule reminders when an appointment is created
   * Creates notifications for both 5 days and 24 hours before
   */
  static async scheduleAppointmentReminders(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        coach: {
          include: { user: true },
        },
        order: {
          include: { product: true },
        },
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const reminderTimes = [
      { offset: 5 * 24 * 60 * 60 * 1000, label: "5d" }, // 5 days in ms
      { offset: 24 * 60 * 60 * 1000, label: "24h" }, // 24 hours in ms
    ];

    for (const { offset, label } of reminderTimes) {
      const scheduledFor = new Date(appointment.startsAt.getTime() - offset);

      // Skip if reminder time is in the past
      if (scheduledFor < new Date()) {
        console.log(
          `⏭️  Skipping ${label} reminder for appointment ${appointmentId} (time is in the past)`
        );
        continue;
      }

      // Schedule email reminder
      await this.createNotification({
        appointmentId: appointment.id,
        userId: appointment.clientId,
        channel: NotificationChannel.email,
        toAddress: appointment.client.email,
        scheduledFor,
        idempotencyKey: `appt:${appointment.id}:reminder:${label}:email`,
        subject: `Reminder: Your coaching session in ${label === "5d" ? "5 days" : "24 hours"}`,
        body: "", // Will be generated when sending
      });

      // Schedule SMS reminder (if opted in)
      if (appointment.client.smsOptIn && appointment.client.phoneE164) {
        await this.createNotification({
          appointmentId: appointment.id,
          userId: appointment.clientId,
          channel: NotificationChannel.sms,
          toAddress: appointment.client.phoneE164,
          scheduledFor,
          idempotencyKey: `appt:${appointment.id}:reminder:${label}:sms`,
          subject: null,
          body: "", // Will be generated when sending
        });
      }
    }

    console.log(`✅ Scheduled reminders for appointment ${appointmentId}`);
  }

  /**
   * Create a notification record in the database
   */
  private static async createNotification(params: {
    appointmentId: string;
    userId: string;
    channel: NotificationChannel;
    toAddress: string;
    scheduledFor: Date;
    idempotencyKey: string;
    subject: string | null;
    body: string;
  }) {
    try {
      await prisma.notification.create({
        data: params,
      });
      console.log(`  ✓ Created ${params.channel} notification: ${params.idempotencyKey}`);
    } catch (error: any) {
      // If unique constraint violation (duplicate idempotency key), skip
      if (error.code === "P2002") {
        console.log(`  ⏭️  Skipped duplicate notification: ${params.idempotencyKey}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Send a notification (called by worker)
   */
  static async sendNotification(notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        appointment: {
          include: {
            client: true,
            coach: {
              include: { user: true },
            },
            order: {
              include: { product: true },
            },
          },
        },
        user: true,
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    // Already sent
    if (notification.status === NotificationStatus.sent) {
      console.log(`⏭️  Notification ${notificationId} already sent`);
      return;
    }

    const appointment = notification.appointment;
    const coachName = appointment.coach.user.name || "Your Coach";
    const clientName = appointment.client.name || "there";
    const productName = appointment.order.product.name;
    const appointmentTime = appointment.startsAt.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: appointment.timezone,
    });

    // Determine time until
    const hoursUntil = (appointment.startsAt.getTime() - Date.now()) / (1000 * 60 * 60);
    const timeUntil = hoursUntil > 48 ? "5 days" : "24 hours";

    // Get user's preferred locale from database
    const client = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { preferredLocale: true },
    });
    const userLocale = (client?.preferredLocale === "fr" ? "fr" : "en") as "en" | "fr";

    try {
      let result;

      if (notification.channel === NotificationChannel.email) {
        result = await EmailSender.sendAppointmentReminder({
          to: notification.toAddress,
          recipientName: clientName,
          coachName,
          appointmentTime,
          productName,
          zoomJoinUrl: appointment.zoomJoinUrl,
          timeUntil,
          locale: userLocale,
        });
      } else if (notification.channel === NotificationChannel.sms) {
        // Only send if user still has SMS opted in
        if (!notification.user.smsOptIn || !notification.user.phoneE164) {
          await prisma.notification.update({
            where: { id: notificationId },
            data: {
              status: NotificationStatus.skipped,
              errorMessage: "User has opted out of SMS or phone number removed",
            },
          });
          console.log(`⏭️  Skipped SMS notification (user opted out): ${notificationId}`);
          return;
        }

        result = await SmsSender.sendAppointmentReminder({
          to: notification.toAddress,
          recipientName: clientName,
          coachName,
          appointmentTime,
          zoomJoinUrl: appointment.zoomJoinUrl,
          timeUntil,
          locale: userLocale,
        });
      } else {
        throw new Error(`Unknown notification channel: ${notification.channel}`);
      }

      // Update notification status
      if (result.success) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.sent,
            sentAt: new Date(),
            providerMessageId: result.providerMessageId || null,
          },
        });
        console.log(`✅ Notification ${notificationId} sent successfully`);
      } else {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.failed,
            errorMessage: result.error || "Unknown error",
          },
        });
        console.log(`❌ Notification ${notificationId} failed: ${result.error}`);
      }
    } catch (error: any) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.failed,
          errorMessage: error.message,
        },
      });
      console.error(`❌ Notification ${notificationId} error:`, error);
    }
  }

  /**
   * Process due notifications (called by worker)
   */
  static async processDueNotifications() {
    const dueNotifications = await prisma.notification.findMany({
      where: {
        status: NotificationStatus.pending,
        scheduledFor: {
          lte: new Date(),
        },
      },
      take: 50, // Process in batches
    });

    console.log(`📬 Processing ${dueNotifications.length} due notifications...`);

    for (const notification of dueNotifications) {
      try {
        await this.sendNotification(notification.id);
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error);
      }
    }
  }
}
