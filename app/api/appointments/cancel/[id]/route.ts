import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppointmentService } from "@/lib/services/appointment-service";

/**
 * POST /api/appointments/cancel/[id]
 * Cancel an appointment
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: appointmentId } = await params;

    const appointment = await AppointmentService.cancelAppointment(
      appointmentId,
      session.user.id,
      session.user.role
    );

    return NextResponse.json({ message: "Appointment canceled", appointment }, { status: 200 });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
