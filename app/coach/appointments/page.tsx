import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { CoachNav } from "@/components/navigation/CoachNav";
import { CoachAppointmentList } from "@/components/coach/CoachAppointmentList";
import { prisma } from "@/lib/prisma";

export default async function CoachAppointmentsPage() {
  const session = await requireRole(UserRole.coach);

  // Get coach record
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
  });

  if (!coach) {
    return <div>Coach profile not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Manage your upcoming 1:1 coaching sessions
            </p>
          </div>

          <CoachAppointmentList coachId={coach.id} />
        </div>
      </main>
    </div>
  );
}
