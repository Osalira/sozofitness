import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { ClientNav } from "@/components/navigation/ClientNav";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  const getStatusBadge = (appointment: typeof appointments[0]) => {
    if (appointment.status === "scheduled") {
      if (appointment.isRescheduled) {
        return <Badge variant="warning">Rescheduled</Badge>;
      }
      return <Badge variant="success">Scheduled</Badge>;
    }
    if (appointment.status === "canceled") {
      return <Badge variant="destructive">Canceled</Badge>;
    }
    if (appointment.status === "completed") {
      return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge variant="outline">{appointment.status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">My Appointments</h1>
            <p className="mt-2 text-base text-muted-foreground">
              View and manage your coaching sessions
            </p>
          </div>

          {/* Unbooked Sessions */}
          {displayOrders.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Ready to Schedule
                </h2>
                <Badge variant="info">{displayOrders.length}</Badge>
              </div>
              <div className="space-y-4">
                {displayOrders.map((order) => (
                  <div key={order.id} className="bg-card border-l-4 border-l-warning border-t border-r border-b border-border rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {order.product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Coach: {order.coach.user.name || "Coach"}
                    </p>
                    <Button asChild variant="default" size="lg">
                      <Link href={`/client/book/${order.id}`}>
                        Schedule Appointment →
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming/Past Appointments */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">All Sessions</h2>

            {appointments.length === 0 && displayOrders.length === 0 && (
              <div className="bg-card rounded-lg shadow-md p-8 text-center border border-border">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-16 w-16 text-muted-foreground"
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
                <h3 className="text-xl font-bold text-foreground mb-2">No Appointments Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Purchase a 1:1 session to book a coaching appointment.
                </p>
                <Button asChild size="lg">
                  <Link href="/discover">
                    Discover Coaches
                  </Link>
                </Button>
              </div>
            )}

            {appointments.length > 0 && (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-foreground mb-2">
                            {appointment.order.product.name}
                          </h3>

                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="font-medium">Coach:</span>{" "}
                              {appointment.coach.user.name || appointment.coach.user.email}
                            </p>
                            <p className="flex items-center gap-2">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Time:</span>{" "}
                              {formatDateTime(new Date(appointment.startsAt), appointment.timezone)}
                            </p>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {getStatusBadge(appointment)}
                        </div>
                      </div>

                      {appointment.zoomJoinUrl && (
                        <div className="pt-4 border-t border-border">
                          <Button asChild variant="info" size="lg" className="w-full sm:w-auto">
                            <a
                              href={appointment.zoomJoinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Join Zoom Meeting
                            </a>
                          </Button>
                          {appointment.zoomPassword && (
                            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Password: <code className="bg-muted px-2 py-0.5 rounded text-foreground font-mono">{appointment.zoomPassword}</code>
                            </p>
                          )}
                        </div>
                      )}

                      {!appointment.zoomJoinUrl && appointment.status === "scheduled" && (
                        <div className="pt-4 border-t border-border">
                          <div className="bg-warning/10 border border-warning/20 rounded-md p-4">
                            <p className="text-sm text-foreground flex items-center gap-2">
                              <svg className="w-5 h-5 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>Meeting link pending - coach will send details</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {appointment.status === "canceled" && (
                        <div className="pt-4 border-t border-border">
                          <Button asChild size="lg" className="w-full sm:w-auto">
                            <Link href={`/client/book/${appointment.orderId}`}>
                              Reschedule Appointment →
                            </Link>
                          </Button>
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
