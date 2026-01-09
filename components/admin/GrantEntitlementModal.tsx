"use client";

import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  type: string;
  coach: {
    user: {
      name: string | null;
    };
  };
}

interface GrantEntitlementModalProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function GrantEntitlementModal({
  userId,
  userEmail,
  onClose,
  onSuccess,
}: GrantEntitlementModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [validityDays, setValidityDays] = useState("365");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products);
        if (data.products.length > 0) {
          setProductId(data.products[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/entitlements/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          productId,
          validityDays: validityDays ? parseInt(validityDays) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to grant entitlement");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grant entitlement");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Grant Entitlement</h2>
            <p className="text-sm text-gray-600 mt-1">For: {userEmail}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-base text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="productId" className="block text-base font-medium text-gray-900 mb-2">
              Product *
            </label>
            <select
              id="productId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.coach.user.name || "Coach"}) - {product.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="validityDays"
              className="block text-base font-medium text-gray-900 mb-2"
            >
              Validity Period
            </label>
            <select
              id="validityDays"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Indefinite (no expiration)</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Warning:</strong> This will grant immediate access to the product. Source
              type will be "admin" and bypass payment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:flex-1 px-6 py-3 text-base border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !productId}
              className="w-full sm:flex-1 px-6 py-3 text-base bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Granting..." : "Grant Access"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
