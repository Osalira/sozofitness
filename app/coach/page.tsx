import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { CoachNav } from "@/components/navigation/CoachNav";
import { RevenueDashboard } from "@/components/coach/RevenueDashboard";

export default async function CoachDashboard() {
  const session = await requireRole(UserRole.coach);

  return (
    <div className="min-h-screen bg-background">
      <CoachNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Coach Dashboard</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Welcome, {session.user.name || "Coach"}! Here's your performance overview.
            </p>
          </div>

          {/* Revenue & Sales Dashboard */}
          <RevenueDashboard />

          {/* Quick Actions */}
          <div className="mt-8 bg-card rounded-lg shadow px-5 py-6 sm:px-6 border border-border">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/coach/products"
                  className="text-left border border-primary bg-primary/10 rounded-lg p-4 hover:bg-primary/20 transition-colors"
                >
                  <h4 className="font-semibold text-primary">Manage Products</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create subscriptions and 1:1 sessions
                  </p>
                  <p className="text-xs text-primary mt-2 font-medium">✨ Available Now</p>
                </Link>

                <Link
                  href="/coach/content"
                  className="text-left border border-accent bg-accent rounded-lg p-4 hover:bg-accent/80 transition-colors"
                >
                  <h4 className="font-semibold text-accent-foreground">Manage Content</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add videos and materials for subscribers
                  </p>
                  <p className="text-xs text-accent-foreground mt-2 font-medium">✨ Available Now</p>
                </Link>

                <Link
                  href="/coach/appointments"
                  className="text-left border border-secondary bg-secondary/10 rounded-lg p-4 hover:bg-secondary/20 transition-colors"
                >
                  <h4 className="font-semibold text-secondary-foreground">Appointments</h4>
                  <p className="text-sm text-muted-foreground mt-1">View upcoming 1:1 sessions</p>
                  <p className="text-xs text-secondary-foreground mt-2 font-medium">✨ Available Now</p>
                </Link>

                <button className="text-left border border-border rounded-lg p-4 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <h4 className="font-semibold text-foreground">Sales Report</h4>
                  <p className="text-sm text-muted-foreground mt-1">View detailed analytics</p>
                  <p className="text-xs text-muted-foreground mt-2">Coming in Step 8</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
