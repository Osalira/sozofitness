import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { CoachNav } from "@/components/navigation/CoachNav";
import { RevenueDashboard } from "@/components/coach/RevenueDashboard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CoachDashboard() {
  const session = await requireRole(UserRole.coach);

  // Get coach record
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
  });

  // Get upcoming appointments (next 3)
  const upcomingAppointments = coach
    ? await prisma.appointment.findMany({
        where: {
          coachId: coach.id,
          status: "scheduled",
          startsAt: { gte: new Date() },
        },
        include: {
          client: {
            select: { name: true, email: true },
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
      })
    : [];

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
      <CoachNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Coach Dashboard</h1>
            <p className="text-base text-muted-foreground mt-2">
              Welcome, {session.user.name || "Coach"}! Here's your performance overview.
            </p>
          </div>

          {/* Revenue & Sales Dashboard */}
          <RevenueDashboard />

          {/* What's Next Panel */}
          <Card className="mt-8 shadow-md">
            <CardHeader className="bg-info/5 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  What's Next
                </CardTitle>
                {upcomingAppointments.length > 0 && (
                  <Button asChild variant="link" size="sm" className="p-0 h-auto">
                    <Link href="/coach/appointments">
                      View All →
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    No upcoming sessions — share your product link to get clients!
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/coach/products">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      View Products
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg hover:border-info hover:bg-accent/30 transition-all"
                    >
                      <div className="flex-1 mb-2 sm:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="info" className="text-xs">
                            {formatDateTime(apt.startsAt)}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-foreground">
                          {apt.order.product.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          with {apt.client.name || apt.client.email}
                        </p>
                      </div>
                      {apt.zoomHostUrl && (
                        <Button asChild variant="info" size="sm">
                          <a href={apt.zoomHostUrl} target="_blank" rel="noopener noreferrer">
                            Start Meeting
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-8 shadow-md">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/coach/products"
                  className="group text-left border-2 border-primary bg-primary/10 rounded-lg p-6 hover:bg-primary/20 hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-primary text-lg">Manage Products</h4>
                        <Badge variant="success" className="mt-1 text-xs">Available</Badge>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create subscriptions and 1:1 sessions
                  </p>
                </Link>

                <Link
                  href="/coach/content"
                  className="group text-left border-2 border-info bg-info/10 rounded-lg p-6 hover:bg-info/20 hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-info/20 rounded-lg">
                        <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-info text-lg">Manage Content</h4>
                        <Badge variant="success" className="mt-1 text-xs">Available</Badge>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-info group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add videos and materials for subscribers
                  </p>
                </Link>

                <Link
                  href="/coach/appointments"
                  className="group text-left border-2 border-border bg-accent rounded-lg p-6 hover:bg-accent/80 hover:border-primary hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-lg">Appointments</h4>
                        <Badge variant="success" className="mt-1 text-xs">Available</Badge>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-foreground group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View upcoming 1:1 sessions
                  </p>
                </Link>

                <div className="relative text-left border-2 border-border bg-muted rounded-lg p-6 opacity-60 cursor-not-allowed">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-muted-foreground text-lg">Sales Report</h4>
                        <Badge variant="outline" className="mt-1 text-xs">Coming Soon</Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View detailed analytics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
