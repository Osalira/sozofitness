import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { ClientNav } from "@/components/navigation/ClientNav";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ClientDashboard() {
  const session = await requireRole(UserRole.client);

  // Get active entitlements for the client
  const entitlements = await prisma.entitlement.findMany({
    where: {
      clientId: session.user.id,
      isActive: true,
      OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
    },
    include: {
      product: {
        include: {
          coach: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get upcoming appointments
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      clientId: session.user.id,
      status: "scheduled",
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    take: 3,
  });

  // Count subscriptions vs one-time products
  const subscriptionCount = entitlements.filter((e) => e.product.type === "subscription").length;

  return (
    <div className="min-h-screen bg-background">
      <ClientNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">My Dashboard</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Welcome back, {session.user.name || session.user.email}!
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card rounded-lg shadow-md p-6 border-l-4 border-l-primary border-t border-r border-b border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Access</h3>
              <p className="text-4xl font-bold text-primary mb-1">{entitlements.length}</p>
              <p className="text-sm text-muted-foreground">
                {subscriptionCount} subscription{subscriptionCount !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-card rounded-lg shadow-md p-6 border-l-4 border-l-info border-t border-r border-b border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Upcoming Sessions</h3>
              <p className="text-4xl font-bold text-info mb-1">{upcomingAppointments.length}</p>
              <p className="text-sm text-muted-foreground">
                {upcomingAppointments.length === 0
                  ? "No sessions scheduled"
                  : `Next: ${upcomingAppointments[0].startsAt.toLocaleDateString()}`}
              </p>
            </div>
          </div>

          {/* Active Access Section */}
          {entitlements.length > 0 ? (
            <div className="bg-card rounded-lg shadow-md mb-8 border border-border overflow-hidden">
              <div className="px-6 py-4 bg-primary/5 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Your Active Access</h3>
              </div>
              <div className="px-6 py-6">
                <div className="space-y-4">
                  {entitlements.map((entitlement) => (
                    <div
                      key={entitlement.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg hover:border-primary hover:shadow-sm transition-all bg-card"
                    >
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={entitlement.product.type === "subscription" ? "default" : "info"}>
                            {entitlement.product.type === "subscription" ? "Subscription" : "1:1 Session"}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-foreground text-lg">{entitlement.product.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Coach: {entitlement.product.coach.user.name || "Coach"}
                        </p>
                        {entitlement.validUntil && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Valid until: {entitlement.validUntil.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {entitlement.product.type === "subscription" && (
                        <Button asChild>
                          <Link href={`/client/content/${entitlement.product.coachId}`}>
                            View Content →
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-md p-8 text-center mb-8 border border-border">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                No Active Access Yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Discover amazing coaches and get access to personalized training content and 1:1 sessions.
              </p>
              <Button asChild size="lg">
                <Link href="/discover">
                  Discover Coaches
                </Link>
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
            <div className="px-6 py-4 bg-muted/50 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/discover"
                  className="group text-left border-2 border-primary bg-primary/10 rounded-lg p-5 hover:bg-primary/20 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h4 className="font-bold text-primary">Discover Coaches</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Browse available coaches and their offerings
                  </p>
                </Link>

                <Link
                  href="/client/appointments"
                  className="group text-left border border-info bg-info/5 rounded-lg p-5 hover:bg-info/10 hover:border-info hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h4 className="font-bold text-info">My Appointments</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View and schedule coaching sessions
                  </p>
                </Link>

                <Link
                  href="/client/access"
                  className="group text-left border border-border bg-accent rounded-lg p-5 hover:bg-accent/80 hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h4 className="font-bold text-foreground">My Access</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View all products you have access to
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
