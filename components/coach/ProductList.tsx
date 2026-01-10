"use client";

import { useState, useEffect } from "react";
import { ProductType } from "@prisma/client";
import { CreateProductModal } from "./CreateProductModal";
import { AddPriceModal } from "./AddPriceModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Price {
  id: string;
  amountCents: number;
  currency: string;
  interval: string | null;
  intervalCount: number | null;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  type: ProductType;
  isActive: boolean;
  prices: Price[];
  createdAt: string;
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddPriceModal, setShowAddPriceModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/coach/products");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch products");
      }

      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductCreated = () => {
    setShowCreateModal(false);
    fetchProducts();
  };

  const handlePriceAdded = () => {
    setShowAddPriceModal(false);
    setSelectedProduct(null);
    fetchProducts();
  };

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

  const copyProductLink = (productId: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/p/${productId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(productId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Create Product Button */}
      <div className="mb-6">
        <Button onClick={() => setShowCreateModal(true)} size="lg">
          + Create Product
        </Button>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-8 text-center border border-border">
          <p className="text-muted-foreground mb-4">You haven't created any products yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-primary hover:text-primary/90 font-medium"
          >
            Create your first product →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {products.map((product) => (
            <div key={product.id} className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
                      <Badge variant={product.type === "subscription" ? "default" : "info"}>
                        {product.type === "subscription" ? "Subscription" : "1:1 Session"}
                      </Badge>
                      {!product.isActive && (
                        <Badge variant="outline">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-muted-foreground text-sm">{product.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => copyProductLink(product.id)}
                        className="p-0 h-auto"
                      >
                        {copiedId === product.id ? (
                          <>
                            <svg
                              className="w-4 h-4 mr-1"
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
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy Link
                          </>
                        )}
                      </Button>
                      <span className="text-muted-foreground">•</span>
                      <a
                        href={`/p/${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Preview →
                      </a>
                    </div>
                  </div>
                </div>

                {/* Prices */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-foreground">Pricing Options</h4>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowAddPriceModal(true);
                        }}
                        className="p-0 h-auto"
                      >
                        + Add Price
                      </Button>
                    </div>

                    {product.prices.length === 0 ? (
                      <div className="bg-muted rounded-md p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">No prices set yet</p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowAddPriceModal(true);
                          }}
                          className="p-0 h-auto"
                        >
                          Add your first price →
                        </Button>
                      </div>
                    ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {product.prices.map((price) => (
                        <div
                          key={price.id}
                          className="bg-muted rounded-md p-4 border border-border"
                        >
                          <p className="text-lg font-semibold text-foreground">
                            {formatPrice(price)}
                          </p>
                          {price.interval && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Billed{" "}
                              {price.intervalCount === 1 ? "" : `every ${price.intervalCount} `}
                              {price.interval}
                              {price.intervalCount && price.intervalCount > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateProductModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleProductCreated}
      />

      <AddPriceModal
        product={selectedProduct!}
        open={showAddPriceModal && !!selectedProduct}
        onOpenChange={(open) => {
          setShowAddPriceModal(open);
          if (!open) setSelectedProduct(null);
        }}
        onSuccess={handlePriceAdded}
      />
    </div>
  );
}
