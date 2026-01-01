import { NextRequest, NextResponse } from "next/server";
import { AppointmentService } from "@/lib/services/appointment-service";

/**
 * GET /api/appointments/available-slots?coachId=xxx&date=2025-12-25
 * Get available appointment slots for a coach on a specific date
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const coachId = searchParams.get("coachId");
    const dateStr = searchParams.get("date");

    if (!coachId || !dateStr) {
      return NextResponse.json({ error: "Coach ID and date are required" }, { status: 400 });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const slots = await AppointmentService.getAvailableSlots(coachId, date);

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error("Get available slots error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get available slots" },
      { status: 500 }
    );
  }
}
