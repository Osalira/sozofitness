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
    <div className="min-h-screen bg-background">
      <AdminNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Stripe Events</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Last 50 processed webhook events
            </p>
          </div>

          <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
            {events.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No events processed yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Event ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Processed At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-foreground">{event.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">{event.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">
                            {new Date(event.processedAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
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

          <div className="mt-6 bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">About Stripe Events</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
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
