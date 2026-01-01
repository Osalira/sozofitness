import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppointmentService } from "@/lib/services/appointment-service";

/**
 * GET /api/coach/appointments
 * Get all appointments for the authenticated coach
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.coach) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get coach record
    const coach = await prisma.coach.findUnique({
      where: { userId: session.user.id },
    });

    if (!coach) {
      return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });
    }

    const appointments = await AppointmentService.getCoachAppointments(coach.id, false);

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error("Get coach appointments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
