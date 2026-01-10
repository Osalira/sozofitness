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
        <div className="text-muted-foreground">Loading content...</div>
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
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          + Add Content
        </button>
      </div>

      {content.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-8 text-center border border-border">
          <p className="text-muted-foreground mb-4">You haven't created any content yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-primary hover:text-primary/90 font-medium"
          >
            Add your first content item →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {content.map((item) => (
            <div key={item.id} className="bg-card rounded-lg shadow-md p-6 border border-border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                    {item.isPublished ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        Draft
                      </span>
                    )}
                    {item.mediaType && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {item.mediaType}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    Product: <span className="font-medium">{item.product.name}</span>
                  </p>

                  {item.description && (
                    <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                  )}

                  {item.mediaUrl && (
                    <a
                      href={item.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/90 font-medium"
                    >
                      View Media →
                    </a>
                  )}

                  {item.publishedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Published: {new Date(item.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => togglePublish(item.id, item.isPublished)}
                  className={`ml-4 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.isPublished
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "bg-accent text-accent-foreground hover:bg-accent/80"
                  }`}
                >
                  {item.isPublished ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateContentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleContentCreated}
      />
    </div>
  );
}
