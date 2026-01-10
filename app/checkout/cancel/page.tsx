import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ product_id?: string }>;
}) {
  await requireAuth();
  const { product_id } = await searchParams;

  // Optionally fetch product details if product_id is provided
  let productName = "the product";
  if (product_id) {
    const product = await prisma.product.findUnique({
      where: { id: product_id },
      select: { name: true },
    });
    if (product) {
      productName = product.name;
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg border border-border p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-yellow-600 dark:text-yellow-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-4">Checkout Canceled</h1>
        <p className="text-muted-foreground mb-8">
          Your payment was canceled. No charges were made to your account.
        </p>

        <div className="space-y-3">
          {product_id && (
            <Link
              href={`/p/${product_id}`}
              className="block w-full bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 font-medium transition-colors"
            >
              Try Again
            </Link>
          )}
          <Link
            href="/client"
            className="block w-full border border-input text-foreground px-6 py-3 rounded-md hover:bg-accent font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>Need help? Contact the coach if you're having trouble with checkout.</p>
        </div>
      </div>
    </div>
  );
}
