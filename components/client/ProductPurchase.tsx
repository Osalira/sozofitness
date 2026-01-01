"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductType } from "@prisma/client";

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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Choose a pricing option:</h3>

        {prices.map((price) => (
          <div
            key={price.id}
            className="border border-gray-300 rounded-lg p-6 flex items-center justify-between hover:border-blue-500 transition-colors"
          >
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900">{formatPrice(price)}</p>
              {price.interval && (
                <p className="text-sm text-gray-600 mt-1">
                  {product.type === "subscription" ? "Billed automatically" : "One-time payment"}
                </p>
              )}
            </div>

            <button
              onClick={() => handlePurchase(price.id)}
              disabled={loading === price.id || hasAccess || !price.stripePriceId}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading === price.id
                ? "Processing..."
                : hasAccess
                  ? "Already Purchased"
                  : !price.stripePriceId
                    ? "Unavailable"
                    : product.type === "subscription"
                      ? "Subscribe"
                      : "Buy Now"}
            </button>
          </div>
        ))}
      </div>

      {!session && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <Link href="/login" className="font-medium underline">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="font-medium underline">
              create an account
            </Link>{" "}
            to purchase this product.
          </p>
        </div>
      )}

      {prices.some((p) => !p.stripePriceId) && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            Some pricing options are not yet available for purchase. The coach needs to complete
            Stripe setup.
          </p>
        </div>
      )}
    </div>
  );
}

function Link({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
