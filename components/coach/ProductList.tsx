"use client";

import { useState, useEffect } from "react";
import { ProductType } from "@prisma/client";
import { CreateProductModal } from "./CreateProductModal";
import { AddPriceModal } from "./AddPriceModal";

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
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Create Product Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Create Product
        </button>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't created any products yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Create your first product →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          product.type === "subscription"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {product.type === "subscription" ? "Subscription" : "1:1 Session"}
                      </span>
                      {!product.isActive && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-gray-600 text-sm">{product.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => copyProductLink(product.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        {copiedId === product.id ? (
                          <>
                            <svg
                              className="w-4 h-4"
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
                              className="w-4 h-4"
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
                            Copy Link to Share
                          </>
                        )}
                      </button>
                      <span className="text-xs text-gray-400">•</span>
                      <a
                        href={`/p/${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Preview →
                      </a>
                    </div>
                  </div>
                </div>

                {/* Prices */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Pricing Options</h4>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowAddPriceModal(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      + Add Price
                    </button>
                  </div>

                  {product.prices.length === 0 ? (
                    <div className="bg-gray-50 rounded-md p-4 text-center">
                      <p className="text-sm text-gray-600">No prices set yet</p>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowAddPriceModal(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-500 mt-2"
                      >
                        Add your first price →
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {product.prices.map((price) => (
                        <div
                          key={price.id}
                          className="bg-gray-50 rounded-md p-4 border border-gray-200"
                        >
                          <p className="text-lg font-semibold text-gray-900">
                            {formatPrice(price)}
                          </p>
                          {price.interval && (
                            <p className="text-xs text-gray-500 mt-1">
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
      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProductCreated}
        />
      )}

      {showAddPriceModal && selectedProduct && (
        <AddPriceModal
          product={selectedProduct}
          onClose={() => {
            setShowAddPriceModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={handlePriceAdded}
        />
      )}
    </div>
  );
}
