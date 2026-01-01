"use client";

import { useState } from "react";
import { ProductType } from "@prisma/client";

interface CreateProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProductModal({ onClose, onSuccess }: CreateProductModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProductType>(ProductType.one_on_one);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/coach/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create Product</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
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
            <label htmlFor="name" className="block text-base font-medium text-gray-900 mb-2">
              Product Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Weekly Fitness Program"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-base font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what clients will get..."
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-base font-medium text-gray-900 mb-2">
              Product Type *
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ProductType)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={ProductType.subscription}>Subscription (Recurring)</option>
              <option value={ProductType.one_on_one}>1:1 Session (One-time)</option>
            </select>
            <p className="mt-2 text-sm text-gray-600">
              {type === ProductType.subscription
                ? "Clients will be charged automatically at regular intervals"
                : "Clients pay once for a single coaching session"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
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
              disabled={loading || !name.trim()}
              className="w-full sm:flex-1 px-6 py-3 text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
