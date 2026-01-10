"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

interface Price {
  id: string;
  amountCents: number;
  currency: string;
  interval: string | null;
  intervalCount: number | null;
  stripePriceId: string | null;
}

interface Product {
  id: string;
  name: string;
  type: ProductType;
}

interface Session {
  user: {
    id: string;
    email: string;
  };
}

interface ProductPurchaseProps {
  product: Product;
  prices: Price[];
  session: Session | null;
  hasAccess: boolean;
}

export function ProductPurchase({ product, prices, session, hasAccess }: ProductPurchaseProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const formatPrice = (price: Price) => {
    const amount = (price.amountCents / 100).toFixed(2);
    const currencySymbol = price.currency === "usd" ? "$" : price.currency.toUpperCase();

    let intervalText = "";
    if (price.interval) {
      const count = price.intervalCount || 1;
      intervalText = count === 1 ? `/${price.interval}` : ` every ${count} ${price.interval}s`;
    }

    return `${currencySymbol}${amount}${intervalText}`;
  };

  const handlePurchase = async (priceId: string) => {
    if (!session) {
      // Redirect to login with return URL
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (hasAccess) {
      setError("You already have access to this product");
      return;
    }

    setError("");
    setLoading(priceId);

    try {
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          productId: product.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setLoading(null);
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Choose a pricing option:
        </h3>

        {prices.map((price) => (
          <div
            key={price.id}
            className="border-2 border-border rounded-lg p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-primary hover:shadow-md transition-all bg-card"
          >
            <div className="flex-1">
              <p className="text-3xl font-bold bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                {formatPrice(price)}
              </p>
              {price.interval && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {product.type === "subscription" ? "Billed automatically" : "One-time payment"}
                </p>
              )}
            </div>

            <Button
              onClick={() => handlePurchase(price.id)}
              disabled={loading === price.id || hasAccess || !price.stripePriceId}
              size="lg"
              variant={hasAccess ? "outline" : "default"}
              className="w-full sm:w-auto"
            >
              {loading === price.id
                ? "Processing..."
                : hasAccess
                  ? "Already Purchased"
                  : !price.stripePriceId
                    ? "Unavailable"
                    : product.type === "subscription"
                      ? "Subscribe Now →"
                      : "Buy Now →"}
            </Button>
          </div>
        ))}
      </div>

      {!session && (
        <div className="mt-6 bg-primary/10 border-l-4 border-l-primary rounded-lg p-4">
          <p className="text-foreground">
            <Link href="/login" className="font-semibold underline text-primary hover:text-primary/80">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="font-semibold underline text-primary hover:text-primary/80">
              create an account
            </Link>{" "}
            to purchase this product.
          </p>
        </div>
      )}

      {prices.some((p) => !p.stripePriceId) && (
        <div className="mt-6 bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-foreground text-sm">
              Some pricing options are not yet available for purchase. The coach needs to complete
              Stripe setup.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
