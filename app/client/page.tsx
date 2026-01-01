import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { ClientNav } from "@/components/navigation/ClientNav";

export default async function ClientDashboard() {
  const session = await requireRole(UserRole.client);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Dashboard</h2>
            <p className="text-gray-600 mb-6">
              Welcome, {session.user.name || "Client"}! Find coaches and book sessions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Subscriptions</h3>
                <p className="text-3xl font-bold text-blue-600">0</p>
                <p className="text-sm text-gray-600 mt-1">No active subscriptions</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upcoming Sessions</h3>
                <p className="text-3xl font-bold text-purple-600">0</p>
                <p className="text-sm text-gray-600 mt-1">No sessions booked</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/client/access"
                  className="text-left border border-blue-300 bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                >
                  <h4 className="font-semibold text-blue-900">My Access</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    View products and content you have access to
                  </p>
                  <p className="text-xs text-blue-600 mt-2 font-medium">✨ Available Now</p>
                </Link>

                <Link
                  href="/client/appointments"
                  className="text-left border border-purple-300 bg-purple-50 rounded-lg p-4 hover:bg-purple-100 transition-colors"
                >
                  <h4 className="font-semibold text-purple-900">My Appointments</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    View and schedule coaching sessions
                  </p>
                  <p className="text-xs text-purple-600 mt-2 font-medium">✨ Available Now</p>
                </Link>

                <button className="text-left border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <h4 className="font-semibold text-gray-900">My Subscriptions</h4>
                  <p className="text-sm text-gray-600 mt-1">Manage your subscriptions</p>
                  <p className="text-xs text-gray-500 mt-2">Coming in Step 4</p>
                </button>

                <button className="text-left border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <h4 className="font-semibold text-gray-900">My Sessions</h4>
                  <p className="text-sm text-gray-600 mt-1">View past and upcoming sessions</p>
                  <p className="text-xs text-gray-500 mt-2">Coming soon</p>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-900 mb-2">
              👋 Welcome to SOZOFITNESS!
            </h3>
            <p className="text-sm text-green-800">
              Your account is set up. Soon you'll be able to browse coaches, subscribe to content,
              and book 1:1 sessions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
