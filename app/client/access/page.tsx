import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { EntitlementService } from "@/lib/services/entitlement-service";
import { ClientNav } from "@/components/navigation/ClientNav";

export default async function ClientAccessPage() {
  const session = await requireRole(UserRole.client);

  const products = await EntitlementService.getClientAccessibleProducts(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Access</h1>
          <p className="text-gray-600 mb-8">Products and content you have access to</p>

          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscriptions</h3>
              <p className="text-gray-600 mb-6">
                You don't have access to any products yet. Browse coaches and subscribe to get
                started!
              </p>
              <Link
                href="/client"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          product.type === "subscription"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {product.type === "subscription" ? "Subscription" : "1:1 Session"}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>

                    {product.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <p className="text-xs text-gray-500 mb-1">Coach</p>
                      <p className="text-sm font-medium text-gray-900">
                        {product.coach.user.name || "Coach"}
                      </p>
                    </div>

                    {product.type === "subscription" && (
                      <Link
                        href={`/client/content/${product.coachId}`}
                        className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-center font-medium transition-colors"
                      >
                        View Content →
                      </Link>
                    )}

                    {product.type === "one_on_one" && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <p className="text-sm text-green-800">
                          ✓ Session purchased - booking coming soon
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                💡 Tip: Maximize Your Investment
              </h3>
              <p className="text-sm text-blue-800">
                You have {products.length} active {products.length === 1 ? "product" : "products"}.
                Check back regularly for new content and updates from your coaches!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
