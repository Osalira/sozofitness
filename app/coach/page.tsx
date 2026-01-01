import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { CoachNav } from "@/components/navigation/CoachNav";
import { RevenueDashboard } from "@/components/coach/RevenueDashboard";

export default async function CoachDashboard() {
  const session = await requireRole(UserRole.coach);

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Coach Dashboard</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Welcome, {session.user.name || "Coach"}! Here's your performance overview.
            </p>
          </div>

          {/* Revenue & Sales Dashboard */}
          <RevenueDashboard />

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/coach/products"
                  className="text-left border border-blue-300 bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                >
                  <h4 className="font-semibold text-blue-900">Manage Products</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Create subscriptions and 1:1 sessions
                  </p>
                  <p className="text-xs text-blue-600 mt-2 font-medium">✨ Available Now</p>
                </Link>

                <Link
                  href="/coach/content"
                  className="text-left border border-green-300 bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors"
                >
                  <h4 className="font-semibold text-green-900">Manage Content</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Add videos and materials for subscribers
                  </p>
                  <p className="text-xs text-green-600 mt-2 font-medium">✨ Available Now</p>
                </Link>

                <Link
                  href="/coach/appointments"
                  className="text-left border border-purple-300 bg-purple-50 rounded-lg p-4 hover:bg-purple-100 transition-colors"
                >
                  <h4 className="font-semibold text-purple-900">Appointments</h4>
                  <p className="text-sm text-purple-700 mt-1">View upcoming 1:1 sessions</p>
                  <p className="text-xs text-purple-600 mt-2 font-medium">✨ Available Now</p>
                </Link>

                <button className="text-left border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <h4 className="font-semibold text-gray-900">Sales Report</h4>
                  <p className="text-sm text-gray-600 mt-1">View detailed analytics</p>
                  <p className="text-xs text-gray-500 mt-2">Coming in Step 8</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
