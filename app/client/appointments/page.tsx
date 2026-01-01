import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { ClientNav } from "@/components/navigation/ClientNav";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ClientAppointmentsPage() {
  const session = await requireRole(UserRole.client);

  // Get client's appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      clientId: session.user.id,
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

  // Get unbooked orders (1:1 products without appointments OR with only past/canceled appointments)
  const allOrders = await prisma.order.findMany({
    where: {
      clientId: session.user.id,
      status: "completed",
      product: {
        type: "one_on_one",
      },
    },
    include: {
      product: true,
      coach: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
      appointments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Filter to orders that can be booked/rebooked
  const unbookedOrders = allOrders.filter((order) => {
    // No appointments at all - can book
    if (order.appointments.length === 0) {
      return true;
    }

    // Check if there's an active (non-canceled) appointment
    const hasActiveAppointment = order.appointments.some((apt) => apt.status !== "canceled");

    if (hasActiveAppointment) {
      return false; // Already has active appointment
    }

    // All appointments are canceled - can rebook if latest one was in the future when canceled
    const latestAppointment = order.appointments[0]; // Already ordered by createdAt desc
    return latestAppointment.startsAt > new Date();
  });

  const displayOrders = unbookedOrders.map(({ appointments, ...order }) => order);

  const formatDateTime = (date: Date, timezone: string) => {
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              View and manage your coaching sessions
            </p>
          </div>

          {/* Unbooked Sessions */}
          {displayOrders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                Ready to Schedule
              </h2>
              <div className="space-y-4">
                {displayOrders.map((order) => (
                  <div key={order.id} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      {order.product.name}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">
                      Coach: {order.coach.user.name || "Coach"}
                    </p>
                    <Link
                      href={`/client/book/${order.id}`}
                      className="inline-block bg-blue-600 text-white px-6 py-2 sm:py-3 rounded-md hover:bg-blue-700 font-medium text-sm sm:text-base"
                    >
                      Schedule Appointment →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming/Past Appointments */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">All Sessions</h2>

            {appointments.length === 0 && displayOrders.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments Yet</h3>
                <p className="text-gray-600 mb-6">
                  Purchase a 1:1 session to book a coaching appointment.
                </p>
                <Link
                  href="/client"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                  Browse Coaches
                </Link>
              </div>
            )}

            {appointments.length > 0 && (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                            {appointment.order.product.name}
                          </h3>

                          <div className="space-y-1 text-sm sm:text-base text-gray-600">
                            <p>
                              <span className="font-medium">Coach:</span>{" "}
                              {appointment.coach.user.name || appointment.coach.user.email}
                            </p>
                            <p>
                              <span className="font-medium">Time:</span>{" "}
                              {formatDateTime(new Date(appointment.startsAt), appointment.timezone)}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                            appointment.status === "scheduled"
                              ? appointment.isRescheduled
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                              : appointment.status === "canceled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {appointment.status === "scheduled" && appointment.isRescheduled
                            ? "rescheduled"
                            : appointment.status}
                        </span>
                      </div>

                      {appointment.zoomJoinUrl && (
                        <div className="pt-4 border-t border-gray-200">
                          <a
                            href={appointment.zoomJoinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-blue-600 text-white px-6 py-2 sm:py-3 rounded-md hover:bg-blue-700 font-medium text-sm sm:text-base"
                          >
                            Join Zoom Meeting
                          </a>
                          {appointment.zoomPassword && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-2">
                              Password: {appointment.zoomPassword}
                            </p>
                          )}
                        </div>
                      )}

                      {!appointment.zoomJoinUrl && appointment.status === "scheduled" && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <p className="text-sm text-yellow-800">
                              ⚠️ Meeting link pending - coach will send details
                            </p>
                          </div>
                        </div>
                      )}

                      {appointment.status === "canceled" && (
                        <div className="pt-4 border-t border-gray-200">
                          <Link
                            href={`/client/book/${appointment.orderId}`}
                            className="inline-block bg-blue-600 text-white px-6 py-2 sm:py-3 rounded-md hover:bg-blue-700 font-medium text-sm sm:text-base"
                          >
                            Reschedule Appointment
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
