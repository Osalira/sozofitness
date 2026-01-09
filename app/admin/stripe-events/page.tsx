import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { AdminNav } from "@/components/navigation/AdminNav";
import { prisma } from "@/lib/prisma";

export default async function AdminStripeEventsPage() {
  const session = await requireRole(UserRole.admin);

  // Get last 50 Stripe events
  const events = await prisma.stripeEvent.findMany({
    take: 50,
    orderBy: { processedAt: "desc" },
    select: {
      id: true,
      type: true,
      processedAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stripe Events</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Last 50 processed webhook events
            </p>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {events.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No events processed yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processed At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">{event.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{event.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(event.processedAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Processed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">About Stripe Events</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All events are processed exactly once (idempotency)</li>
              <li>• Events are stored permanently for audit trail</li>
              <li>• Check Stripe Dashboard for full event details</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
