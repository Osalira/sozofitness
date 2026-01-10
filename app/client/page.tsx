import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { ClientNav } from "@/components/navigation/ClientNav";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // For 1:1 sessions, get the order ID from sourceId if sourceType is "order"
  const entitlementsWithOrders = entitlements.map((ent) => ({
    ...ent,
    orderId:
      ent.product.type === "one_on_one" && ent.sourceType === "order"
        ? ent.sourceId
        : null,
  }));

  // Get upcoming appointments with Zoom links
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      clientId: session.user.id,
      status: "scheduled",
      startsAt: { gte: new Date() },
    },
    include: {
      coach: {
        include: {
          user: {
            select: { name: true },
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
    take: 3,
  });

  // Count subscriptions vs one-time products
  const subscriptionCount = entitlements.filter((e) => e.product.type === "subscription").length;
  const oneOnOneCount = entitlements.filter((e) => e.product.type === "one_on_one").length;

  // Get next appointment with Zoom link
  const nextZoomSession = upcomingAppointments.find((apt) => apt.zoomJoinUrl);

  // Format date/time for next session
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">My Dashboard</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Welcome back, {session.user.name || session.user.email}!
            </p>
          </div>

          {/* Urgent: Next Zoom Session */}
          {nextZoomSession && nextZoomSession.zoomJoinUrl && (
            <div className="mb-8 bg-gradient-to-r from-info/10 to-primary/10 border-l-4 border-l-info rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <Badge variant="info">Upcoming Session</Badge>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {nextZoomSession.order.product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      with {nextZoomSession.coach.user.name || "your coach"}
                    </p>
                    <p className="text-sm font-medium text-foreground mt-2">
                      📅 {formatDateTime(nextZoomSession.startsAt)}
                    </p>
                  </div>
                  <Button asChild variant="info" size="lg" className="w-full sm:w-auto shadow-lg">
                    <a
                      href={nextZoomSession.zoomJoinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Join Zoom Meeting
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Active Access Card */}
            <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Active Access
                      </h3>
                    </div>
                    <p className="text-5xl font-bold text-primary mb-2">{entitlements.length}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {subscriptionCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          {subscriptionCount} subscription{subscriptionCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {oneOnOneCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-info"></span>
                          {oneOnOneCount} 1:1 session{oneOnOneCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Sessions Card */}
            <Card className="border-l-4 border-l-info shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Upcoming Sessions
                      </h3>
                    </div>
                    <p className="text-5xl font-bold text-info mb-2">{upcomingAppointments.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {upcomingAppointments.length === 0 ? (
                        "No sessions scheduled"
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Next: {formatDateTime(upcomingAppointments[0].startsAt)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Access Section */}
          {entitlements.length > 0 ? (
            <Card className="mb-8 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg">Your Active Access</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {entitlementsWithOrders.map((entitlement) => {
                    const isSubscription = entitlement.product.type === "subscription";
                    const hasOrder = !!entitlement.orderId;

                    return (
                      <div
                        key={entitlement.id}
                        className="group flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 border border-border rounded-lg hover:border-primary hover:shadow-md transition-all bg-card"
                      >
                        <div className="flex-1 mb-4 sm:mb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={isSubscription ? "default" : "info"}>
                              {isSubscription ? "Subscription" : "1:1 Session"}
                            </Badge>
                            {entitlement.validUntil && (
                              <span className="text-xs text-muted-foreground">
                                • Expires {new Date(entitlement.validUntil).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-foreground text-lg mb-1">
                            {entitlement.product.name}
                          </h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Coach: {entitlement.product.coach.user.name || "Coach"}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          {isSubscription ? (
                            <Button asChild size="lg" className="w-full sm:w-auto">
                              <Link href={`/client/content/${entitlement.product.coachId}`}>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Content
                              </Link>
                            </Button>
                          ) : hasOrder ? (
                            <Button asChild size="lg" variant="default" className="w-full sm:w-auto">
                              <Link href={`/client/book/${entitlement.orderId}`}>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Book Session
                              </Link>
                            </Button>
                          ) : (
                            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                              <Link href="/discover">
                                Purchase to Book
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8 shadow-md">
              <CardContent className="p-12 text-center">
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
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Discover Coaches
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="shadow-md">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/discover"
                  className="group relative text-left border-2 border-primary bg-primary/10 rounded-lg p-6 hover:bg-primary/20 hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-primary text-lg">Discover Coaches</h4>
                    </div>
                    <svg className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Browse available coaches and their offerings
                  </p>
                </Link>

                <Link
                  href="/client/appointments"
                  className="group relative text-left border-2 border-info bg-info/10 rounded-lg p-6 hover:bg-info/20 hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-info/20 rounded-lg">
                        <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-info text-lg">My Appointments</h4>
                    </div>
                    <svg className="w-5 h-5 text-info group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View and schedule coaching sessions
                  </p>
                </Link>

                <Link
                  href="/client/access"
                  className="group relative text-left border-2 border-border bg-accent rounded-lg p-6 hover:bg-accent/80 hover:border-primary hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-foreground text-lg">My Access</h4>
                    </div>
                    <svg className="w-5 h-5 text-foreground group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View all products you have access to
                  </p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
