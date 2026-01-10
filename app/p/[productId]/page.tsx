import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/client/ProductPurchase";
import { getSession } from "@/lib/auth-helpers";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                SOZOFITNESS
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {session ? (
                <>
                  <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/api/auth/signout">
                      Sign out
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Sign in
                  </Link>
                  <Button asChild size="sm">
                    <Link href="/signup">
                      Sign up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Product Header */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border-l-4 border-l-primary border-t border-r border-b border-border">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Badge variant={product.type === "subscription" ? "default" : "info"} className="text-sm px-3 py-1">
                {product.type === "subscription" ? "Subscription" : "1:1 Session"}
              </Badge>
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-4">{product.name}</h1>

            {product.description && (
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{product.description}</p>
            )}

            <div className="border-t border-border pt-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-info rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold shadow-md">
                  {(product.coach.user.name || "C")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Offered by</h3>
                  <p className="text-lg font-bold text-foreground">
                    {product.coach.user.name || "Coach"}
                  </p>
                </div>
              </div>
            </div>

            {/* Access Status */}
            {hasAccess && (
              <div className="bg-success/10 border-l-4 border-l-success border-t border-r border-b border-success/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-success font-semibold">You have access to this product</p>
                </div>
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
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-foreground font-medium">
                    This product doesn't have any pricing options yet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-gradient-to-r from-info/10 to-primary/10 border-l-4 border-l-info rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-info flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Secure Checkout</h3>
              <p className="text-sm text-muted-foreground">
                Payments are securely processed by Stripe. Your payment information is never stored on
                our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Discovery */}
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link href="/discover">
              ← Back to Coaches
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
