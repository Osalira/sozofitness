import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/client/ProductPurchase";
import { getSession } from "@/lib/auth-helpers";
import Link from "next/link";

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const session = await getSession();
  const { productId } = await params;

  // Fetch product with prices and coach info
  // NOTE: findUnique() can only use unique fields. Use findFirst() for filtered lookups.
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
    },
    include: {
      prices: {
        where: { isActive: true },
        orderBy: { amountCents: "asc" },
      },
      coach: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Check if user already has an entitlement
  let hasAccess = false;
  if (session?.user) {
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        clientId: session.user.id,
        productId: product.id,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    });
    hasAccess = !!entitlement;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                SOZOFITNESS
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <Link href="/app" className="text-sm text-gray-600 hover:text-gray-900">
                    Dashboard
                  </Link>
                  <Link
                    href="/api/auth/signout"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Sign out
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Product Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  product.type === "subscription"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {product.type === "subscription" ? "Subscription" : "1:1 Session"}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {product.description && (
              <p className="text-lg text-gray-600 mb-6">{product.description}</p>
            )}

            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Offered by</h3>
              <p className="text-lg font-semibold text-gray-900">
                {product.coach.user.name || "Coach"}
              </p>
            </div>

            {/* Access Status */}
            {hasAccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">✓ You have access to this product</p>
              </div>
            )}

            {/* Prices and Purchase Buttons */}
            {product.prices.length > 0 ? (
              <ProductPurchase
                product={product}
                prices={product.prices}
                session={session}
                hasAccess={hasAccess}
              />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  This product doesn't have any pricing options yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Secure Checkout</h3>
          <p className="text-sm text-blue-800">
            Payments are securely processed by Stripe. Your payment information is never stored on
            our servers.
          </p>
        </div>
      </main>
    </div>
  );
}
