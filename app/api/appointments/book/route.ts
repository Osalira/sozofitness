import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppointmentService } from "@/lib/services/appointment-service";

/**
 * POST /api/appointments/book
 * Book an appointment for a 1:1 session
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, startsAt, timezone, notes } = body;

    if (!orderId || !startsAt) {
      return NextResponse.json({ error: "Order ID and start time are required" }, { status: 400 });
    }

    // Verify order exists, belongs to client, and is for one_on_one product
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        clientId: session.user.id,
        status: "completed",
      },
      include: {
        product: true,
        appointments: {
          where: { status: { not: "canceled" } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or not authorized" }, { status: 404 });
    }

    if (order.product.type !== "one_on_one") {
      return NextResponse.json(
        { error: "Can only book appointments for 1:1 session products" },
        { status: 400 }
      );
    }

    // Check if order has an active (non-canceled) appointment
    if (order.appointments.length > 0) {
      return NextResponse.json(
        { error: "This order already has an active appointment booked" },
        { status: 400 }
      );
    }

    // Parse and validate start time
    const appointmentStart = new Date(startsAt);
    if (isNaN(appointmentStart.getTime())) {
      return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
    }

    // Check if time is in the future
    if (appointmentStart < new Date()) {
      return NextResponse.json({ error: "Cannot book appointments in the past" }, { status: 400 });
    }

    // Create appointment with Zoom meeting
    const appointment = await AppointmentService.createAppointment({
      coachId: order.coachId,
      clientId: session.user.id,
      orderId: order.id,
      startsAt: appointmentStart,
      duration: 60, // Default 60 minutes for MVP
      timezone: timezone || "UTC",
      notes: notes || undefined,
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Book appointment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to book appointment" },
      { status: 500 }
    );
  }
}
