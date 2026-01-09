import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { AdminNav } from "@/components/navigation/AdminNav";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const session = await requireRole(UserRole.admin);

  // Get quick stats
  const [userCount, orderCount, subscriptionCount, eventCount] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({ where: { status: "completed" } }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.stripeEvent.count(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Console</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              System administration and user management
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-gray-900">{userCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Completed Orders</h3>
              <p className="text-3xl font-bold text-blue-600">{orderCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Active Subscriptions</h3>
              <p className="text-3xl font-bold text-green-600">{subscriptionCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Stripe Events</h3>
              <p className="text-3xl font-bold text-purple-600">{eventCount}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/admin/users"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Search</h3>
              <p className="text-sm text-gray-600">Search users and manage entitlements</p>
            </Link>

            <Link
              href="/admin/stripe-events"
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Stripe Events</h3>
              <p className="text-sm text-gray-600">
                View recent webhook events and processing status
              </p>
            </Link>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Health</h3>
              <p className="text-sm text-gray-600">All systems operational ✅</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
