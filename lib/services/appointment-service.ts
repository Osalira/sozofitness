import { prisma } from "@/lib/prisma";
import { ZoomService } from "./zoom-service";
import { NotificationService } from "./notification-service";

interface CreateAppointmentParams {
  coachId: string;
  clientId: string;
  orderId: string;
  startsAt: Date;
  duration: number; // in minutes
  timezone?: string;
  notes?: string;
}

export class AppointmentService {
  /**
   * Create an appointment with optional Zoom meeting
   */
  static async createAppointment(params: CreateAppointmentParams) {
    const { coachId, clientId, orderId, startsAt, duration, timezone = "UTC", notes } = params;

    // Calculate end time
    const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);

    // Check if this is a rescheduled appointment
    const previousAppointments = await prisma.appointment.findMany({
      where: { orderId, status: "canceled" },
    });
    const isRescheduled = previousAppointments.length > 0;

    // Get coach and product info for Zoom meeting topic
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        coach: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        client: {
          select: { name: true, email: true },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Try to create Zoom meeting
    let zoomMeetingId: string | null = null;
    let zoomJoinUrl: string | null = null;
    let zoomHostUrl: string | null = null;
    let zoomPassword: string | null = null;

    try {
      const coachName = order.coach.user.name || "Coach";
      const clientName = order.client.name || "Client";

      const meeting = await ZoomService.createMeeting({
        topic: `1:1 Session: ${order.product.name}`,
        startTime: startsAt,
        duration,
        timezone,
        coachEmail: order.coach.user.email,
      });

      if (meeting) {
        zoomMeetingId = meeting.meetingId;
        zoomJoinUrl = meeting.joinUrl;
        zoomHostUrl = meeting.hostUrl;
        zoomPassword = meeting.password || null;
      }
    } catch (error) {
      console.error("Failed to create Zoom meeting:", error);
      // Continue without Zoom - appointment still created
      console.warn("⚠️  Appointment will be created without Zoom meeting link");
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        coachId,
        clientId,
        orderId,
        startsAt,
        endsAt,
        timezone,
        notes,
        zoomMeetingId,
        zoomJoinUrl,
        zoomHostUrl,
        zoomPassword,
        status: "scheduled",
        isRescheduled,
      },
      include: {
        coach: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        client: {
          select: { name: true, email: true },
        },
        order: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Schedule reminders (email + SMS if opted in)
    try {
      await NotificationService.scheduleAppointmentReminders(appointment.id);
    } catch (error) {
      console.error("Failed to schedule reminders:", error);
      // Don't fail appointment creation if reminder scheduling fails
    }

    return appointment;
  }

  /**
   * Get coach's appointments
   */
  static async getCoachAppointments(coachId: string, includeCompleted = false) {
    return await prisma.appointment.findMany({
      where: {
        coachId,
        status: includeCompleted ? undefined : { in: ["scheduled", "no_show"] },
      },
      include: {
        client: {
          select: { name: true, email: true, phoneE164: true },
        },
        order: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { startsAt: "asc" },
    });
  }

  /**
   * Get client's appointments
   */
  static async getClientAppointments(clientId: string, includeCompleted = false) {
    return await prisma.appointment.findMany({
      where: {
        clientId,
        status: includeCompleted ? undefined : { in: ["scheduled", "no_show"] },
      },
      include: {
        coach: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        order: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { startsAt: "asc" },
    });
  }

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(appointmentId: string, userId: string, userRole: string) {
    // Verify ownership
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [{ clientId: userId }, { coach: { userId } }],
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found or access denied");
    }

    // Cannot cancel past appointments
    if (appointment.startsAt < new Date()) {
      throw new Error("Cannot cancel past appointments");
    }

    // Cancel Zoom meeting if exists
    if (appointment.zoomMeetingId) {
      try {
        await ZoomService.deleteMeeting(appointment.zoomMeetingId);
      } catch (error) {
        console.error("Failed to delete Zoom meeting, continuing with cancellation:", error);
      }
    }

    // Update appointment status
    return await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "canceled" },
    });
  }

  /**
   * Get available time slots for a coach on a specific date
   */
  static async getAvailableSlots(
    coachId: string,
    date: Date
  ): Promise<{ startTime: Date; endTime: Date }[]> {
    const dayOfWeek = date.getDay();

    // Get coach availability for this day
    const availabilities = await prisma.coachAvailability.findMany({
      where: {
        coachId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (availabilities.length === 0) {
      return [];
    }

    // Get existing appointments for this day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        coachId,
        startsAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ["scheduled"] },
      },
      select: { startsAt: true, endsAt: true },
    });

    // Generate slots from availability (simple 60-min slots for MVP)
    const slots: { startTime: Date; endTime: Date }[] = [];

    for (const avail of availabilities) {
      const [startHour, startMin] = avail.startTime.split(":").map(Number);
      const [endHour, endMin] = avail.endTime.split(":").map(Number);

      let currentSlotStart = new Date(date);
      currentSlotStart.setHours(startHour, startMin, 0, 0);

      const availEnd = new Date(date);
      availEnd.setHours(endHour, endMin, 0, 0);

      // Generate hourly slots
      while (currentSlotStart < availEnd) {
        const slotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000);

        // Check if slot conflicts with existing appointment
        const hasConflict = existingAppointments.some(
          (appt) => appt.startsAt < slotEnd && appt.endsAt > currentSlotStart
        );

        if (!hasConflict && slotEnd <= availEnd) {
          slots.push({
            startTime: new Date(currentSlotStart),
            endTime: slotEnd,
          });
        }

        currentSlotStart = slotEnd;
      }
    }

    return slots;
  }
}
