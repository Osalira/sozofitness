import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const session = await requireAuth();
  const { session_id } = await searchParams;

  // Fetch order details using the session ID (if available)
  let orderDetails = null;
  if (session_id) {
    orderDetails = await prisma.order.findFirst({
      where: {
        stripeCheckoutSessionId: session_id,
        clientId: session.user.id, // Security: ensure order belongs to current user
      },
      include: {
        product: {
          include: {
            coach: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg border border-border p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-4">Payment Successful!</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for your purchase. Your payment has been processed successfully.
        </p>

        {/* Order Details (if available) */}
        {orderDetails && (
          <div className="bg-accent/50 rounded-lg p-4 mb-6 border border-border">
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Order ID:</span>
                <span className="text-sm font-mono font-semibold text-foreground">
                  #{orderDetails.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Product:</span>
                <span className="text-sm font-medium text-foreground">
                  {orderDetails.product.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Coach:</span>
                <span className="text-sm font-medium text-foreground">
                  {orderDetails.product.coach.user.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-sm font-semibold text-success">
                  ${(orderDetails.amountCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Show session ID only in development mode */}
        {process.env.NODE_ENV === "development" && session_id && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-6">
            <p className="text-xs text-warning font-mono break-all">
              DEV: Session {session_id}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/client"
            className="block w-full bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
          <p className="text-sm text-muted-foreground">
            You'll receive a confirmation email shortly with your purchase details.
          </p>
        </div>

        <div className="mt-8 bg-info/10 border border-info/20 rounded-lg p-4">
          <p className="text-sm text-foreground">
            <strong className="text-info">Note:</strong> It may take a few moments for your access
            to be activated. If you don't see it immediately, please refresh the page.
          </p>
        </div>
      </div>
    </div>
  );
}
