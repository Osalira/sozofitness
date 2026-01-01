"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  type: string;
}

interface CreateContentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateContentModal({ onClose, onSuccess }: CreateContentModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("video");
  const [productId, setProductId] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch coach's subscription products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/coach/products");
        const data = await response.json();

        if (response.ok) {
          // Filter to subscription products only
          const subscriptionProducts = data.products.filter(
            (p: Product) => p.type === "subscription"
          );
          setProducts(subscriptionProducts);
          if (subscriptionProducts.length > 0) {
            setProductId(subscriptionProducts[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!productId) {
        throw new Error("Please select a product");
      }

      const response = await fetch("/api/coach/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          mediaUrl: mediaUrl.trim() || undefined,
          mediaType,
          productId,
          isPublished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create content");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create content");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add Content</h2>
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

        {products.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-base text-yellow-800">
              You need to create a <strong>Subscription</strong> product first. Content can only be
              added to subscription products.
            </p>
            <Link
              href="/coach/products"
              className="text-sm text-yellow-900 underline font-medium mt-2 inline-block"
            >
              Go to Products →
            </Link>
          </div>
        )}

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
              disabled={products.length === 0}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {products.length === 0 ? (
                <option value="">No subscription products available</option>
              ) : (
                products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))
              )}
            </select>
            <p className="mt-2 text-sm text-gray-600">
              Only clients who purchased this product will see this content
            </p>
          </div>

          <div>
            <label htmlFor="title" className="block text-base font-medium text-gray-900 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Week 1: Upper Body Workout"
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
              placeholder="What will clients learn from this content?"
            />
          </div>

          <div>
            <label htmlFor="mediaUrl" className="block text-base font-medium text-gray-900 mb-2">
              Media URL
            </label>
            <input
              id="mediaUrl"
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="mt-2 text-sm text-gray-600">
              Paste a YouTube, Vimeo, or direct video URL
            </p>
          </div>

          <div>
            <label htmlFor="mediaType" className="block text-base font-medium text-gray-900 mb-2">
              Media Type
            </label>
            <select
              id="mediaType"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="video">Video</option>
              <option value="article">Article</option>
              <option value="pdf">PDF</option>
              <option value="audio">Audio</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-start pt-2">
            <input
              id="isPublished"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-5 w-5 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublished" className="ml-3 block text-base text-gray-900">
              Publish immediately (make visible to clients)
            </label>
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
              disabled={loading || !title.trim() || products.length === 0}
              className="w-full sm:flex-1 px-6 py-3 text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Creating..." : "Create Content"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
