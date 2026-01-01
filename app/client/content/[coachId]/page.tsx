import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { EntitlementService } from "@/lib/services/entitlement-service";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClientNav } from "@/components/navigation/ClientNav";

interface ContentPageProps {
  params: Promise<{ coachId: string }>;
}

export default async function ClientContentPage({ params }: ContentPageProps) {
  const session = await requireRole(UserRole.client);
  const { coachId } = await params;

  // Check if client has ANY entitlement to this coach's products
  const hasAccess = await EntitlementService.hasActiveEntitlementToCoach(session.user.id, coachId);

  // Get coach info
  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!coach) {
    redirect("/client");
  }

  // If no access, show paywall
  if (!hasAccess) {
    // Get coach's available products
    const products = await prisma.product.findMany({
      where: {
        coachId,
        isActive: true,
        type: "subscription", // Only subscriptions give content access
      },
      include: {
        prices: {
          where: { isActive: true },
          orderBy: { amountCents: "asc" },
          take: 1,
        },
      },
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <ClientNav userName={session.user.name} userEmail={session.user.email} />

        <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">Subscribe to Access Content</h1>
            <p className="text-gray-600 mb-8">
              You need an active subscription to access content from{" "}
              <span className="font-semibold">{coach.user.name || "this coach"}</span>.
            </p>

            {products.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Available Subscriptions:</h3>
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/p/${product.id}`}
                    className="block border border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h4>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                    )}
                    {product.prices[0] && (
                      <p className="text-xl font-bold text-blue-600">
                        ${(product.prices[0].amountCents / 100).toFixed(2)}
                        {product.prices[0].interval && `/${product.prices[0].interval}`}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8">
              <Link href="/client" className="text-sm text-gray-600 hover:text-gray-900 underline">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Client has access - show content
  const content = await EntitlementService.getClientAccessibleContent(session.user.id, coachId);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Content from {coach.user.name || "Coach"}
            </h1>
            <p className="text-gray-600">Access your exclusive content library</p>
          </div>

          {content.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">
                No content has been published yet. Check back soon!
              </p>
              <p className="text-sm text-gray-500">
                Your coach will add videos and materials here as they become available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {item.mediaUrl && (
                    <div className="bg-gray-200 h-48 flex items-center justify-center">
                      {item.mediaType === "video" ? (
                        <svg
                          className="w-16 h-16 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-16 h-16 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      )}
                    </div>
                  )}

                  <div className="p-6">
                    <div className="mb-3">
                      <span className="text-xs text-gray-500">{item.product.name}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>

                    {item.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{item.description}</p>
                    )}

                    {item.mediaUrl && (
                      <a
                        href={item.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-center font-medium transition-colors"
                      >
                        {item.mediaType === "video" ? "Watch Video" : "View Content"} →
                      </a>
                    )}

                    {item.publishedAt && (
                      <p className="text-xs text-gray-500 mt-4">
                        Published {new Date(item.publishedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
