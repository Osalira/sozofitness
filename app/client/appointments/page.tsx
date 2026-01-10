import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { ClientNav } from "@/components/navigation/ClientNav";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentCard } from "@/components/client/AppointmentCard";

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
    orderBy: { startsAt: "desc" },
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

  // Group appointments: upcoming (future scheduled) vs past (completed/canceled/past scheduled)
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "scheduled" && new Date(apt.startsAt) >= now
  );
  const pastAppointments = appointments.filter(
    (apt) =>
      apt.status === "completed" ||
      apt.status === "canceled" ||
      (apt.status === "scheduled" && new Date(apt.startsAt) < now)
  );

  return (
    <div className="min-h-screen bg-background">
      <ClientNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">My Appointments</h1>
            <p className="mt-2 text-base text-muted-foreground">
              View and manage your coaching sessions
            </p>
          </div>

          {/* Unbooked Sessions - Ready to Schedule */}
          {displayOrders.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-foreground">Ready to Schedule</h2>
                <Badge variant="warning">{displayOrders.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="border-l-4 border-l-warning hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {order.product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Coach: {order.coach.user.name || "Coach"}
                      </p>
                      <Button asChild variant="default" size="lg" className="w-full">
                        <Link href={`/client/book/${order.id}`}>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Schedule Appointment
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {appointments.length === 0 && displayOrders.length === 0 && (
            <Card className="shadow-md">
              <CardContent className="p-12 text-center">
                <div className="mb-6">
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
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Purchase a 1:1 session from a coach to book your first appointment.
                </p>
                <Button asChild size="lg">
                  <Link href="/discover">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Discover Coaches
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-foreground">Upcoming</h2>
                <Badge variant="success">{upcomingAppointments.length}</Badge>
              </div>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </div>
          )}

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-foreground">Past Sessions</h2>
                <Badge variant="secondary">{pastAppointments.length}</Badge>
              </div>
              <div className="space-y-4">
                {pastAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
