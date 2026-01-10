import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { AdminNav } from "@/components/navigation/AdminNav";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const session = await requireRole(UserRole.admin);

  // Get quick stats with more context
  const [userCount, orderCount, subscriptionCount, eventCount, recentOrders, recentEvents] =
    await Promise.all([
      prisma.user.count(),
      prisma.order.count({ where: { status: "completed" } }),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.stripeEvent.count(),
      // Get orders from last 7 days
      prisma.order.count({
        where: {
          status: "completed",
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      // Get last 3 stripe events
      prisma.stripeEvent.findMany({
        take: 3,
        orderBy: { processedAt: "desc" },
        select: {
          id: true,
          type: true,
          processedAt: true,
        },
      }),
    ]);

  // Check API health
  let healthStatus: "ok" | "error" = "ok";
  try {
    const healthRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/health`, {
      cache: "no-store",
    });
    healthStatus = healthRes.ok ? "ok" : "error";
  } catch {
    healthStatus = "error";
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Admin Console</h1>
            <p className="mt-2 text-base text-muted-foreground">
              System administration and user management
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Total Users */}
            <Card className="border-l-4 border-l-info shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Total Users
                  </h3>
                </div>
                <p className="text-4xl font-bold text-info">{userCount}</p>
              </CardContent>
            </Card>

            {/* Completed Orders */}
            <Card className="border-l-4 border-l-success shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Completed Orders
                  </h3>
                </div>
                <p className="text-4xl font-bold text-success">{orderCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {recentOrders} in last 7 days
                </p>
              </CardContent>
            </Card>

            {/* Active Subscriptions */}
            <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Active Subscriptions
                  </h3>
                </div>
                <p className="text-4xl font-bold text-primary">{subscriptionCount}</p>
              </CardContent>
            </Card>

            {/* Stripe Events */}
            <Card className="border-l-4 border-l-warning shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Stripe Events
                  </h3>
                </div>
                <p className="text-4xl font-bold text-warning">{eventCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {eventCount > 0 ? "All processed" : "Waiting for webhooks"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Search */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-info/5 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  User Search
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Search users and manage entitlements
                </p>
                <Button asChild size="lg" className="w-full">
                  <Link href="/admin/users">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Users
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Stripe Events */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-warning/5 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Stripe Events
                  </CardTitle>
                  {recentEvents.length > 0 && (
                    <Button asChild variant="link" size="sm" className="p-0 h-auto">
                      <Link href="/admin/stripe-events">View All →</Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {recentEvents.length === 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      No webhook events processed yet
                    </p>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <Link href="/admin/stripe-events">View Event Log</Link>
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    {recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 border border-border rounded-lg hover:border-warning hover:bg-accent/30 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground truncate">
                            {event.type}
                          </span>
                          <Badge variant="success" className="text-xs flex-shrink-0">OK</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.processedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-success/5 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {/* API Health */}
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${healthStatus === "ok" ? "bg-success" : "bg-destructive"}`}></span>
                      <span className="text-sm font-medium text-foreground">API</span>
                    </div>
                    <Badge variant={healthStatus === "ok" ? "success" : "destructive"} className="text-xs">
                      {healthStatus === "ok" ? "Healthy" : "Error"}
                    </Badge>
                  </div>

                  {/* Database */}
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success"></span>
                      <span className="text-sm font-medium text-foreground">Database</span>
                    </div>
                    <Badge variant="success" className="text-xs">
                      Connected
                    </Badge>
                  </div>

                  {/* Stripe */}
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${eventCount > 0 ? "bg-success" : "bg-warning"}`}></span>
                      <span className="text-sm font-medium text-foreground">Stripe</span>
                    </div>
                    <Badge variant={eventCount > 0 ? "success" : "warning"} className="text-xs">
                      {eventCount > 0 ? "Active" : "Pending"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Banner */}
          <Card className="mt-8 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-border">
              <CardTitle className="text-lg">Administrative Tools</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/admin/users"
                  className="group text-left border-2 border-primary bg-primary/10 rounded-lg p-6 hover:bg-primary/20 hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-primary text-lg">Manage Users</h4>
                    </div>
                    <svg className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Search users, view details, grant entitlements
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="info" className="text-xs">{userCount} Total</Badge>
                  </div>
                </Link>

                <Link
                  href="/admin/stripe-events"
                  className="group text-left border-2 border-warning bg-warning/10 rounded-lg p-6 hover:bg-warning/20 hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-warning/20 rounded-lg">
                        <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-warning text-lg">Webhook Events</h4>
                    </div>
                    <svg className="w-5 h-5 text-warning group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View and monitor Stripe webhook processing
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="success" className="text-xs">{eventCount} Processed</Badge>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Info Banner */}
          <div className="mt-8 bg-gradient-to-r from-warning/10 to-primary/10 border-l-4 border-l-warning rounded-lg p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">Admin Access</h3>
                <p className="text-sm text-muted-foreground">
                  You have full administrative privileges. Use caution when granting entitlements or
                  modifying user data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
