"use client";

import { useState, useEffect } from "react";
import { CreateContentModal } from "./CreateContentModal";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  publishedAt: string | null;
  isPublished: boolean;
  createdAt: string;
  product: {
    name: string;
    type: string;
  };
}

export function ContentList() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/coach/content");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch content");
      }

      setContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleContentCreated = () => {
    setShowCreateModal(false);
    fetchContent();
  };

  const togglePublish = async (contentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/coach/content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update content");
      }

      fetchContent();
    } catch (err) {
      console.error("Toggle publish error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading content...</div>
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
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Content
        </button>
      </div>

      {content.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't created any content yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Add your first content item →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {content.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                    {item.isPublished ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                        Draft
                      </span>
                    )}
                    {item.mediaType && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {item.mediaType}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    Product: <span className="font-medium">{item.product.name}</span>
                  </p>

                  {item.description && (
                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                  )}

                  {item.mediaUrl && (
                    <a
                      href={item.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                      View Media →
                    </a>
                  )}

                  {item.publishedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Published: {new Date(item.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => togglePublish(item.id, item.isPublished)}
                  className={`ml-4 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.isPublished
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {item.isPublished ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateContentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleContentCreated}
        />
      )}
    </div>
  );
}
