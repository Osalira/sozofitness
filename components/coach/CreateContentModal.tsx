"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  type: string;
}

interface CreateContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateContentModal({ open, onOpenChange, onSuccess }: CreateContentModalProps) {
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
    if (open) {
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
    }
  }, [open]);

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

      toast.success("Content created successfully!");
      onSuccess();
      onOpenChange(false);
      // Reset form
      setTitle("");
      setDescription("");
      setMediaUrl("");
      setMediaType("video");
      setIsPublished(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create content");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
        </DialogHeader>

        {products.length === 0 && (
          <Alert>
            <AlertDescription>
              You need to create a <strong>Subscription</strong> product first. Content can only be
              added to subscription products.{" "}
              <Link
                href="/coach/products"
                className="underline font-medium"
                onClick={() => onOpenChange(false)}
              >
                Go to Products →
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="productId">
              Product <span className="text-destructive">*</span>
            </Label>
            <select
              id="productId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              disabled={products.length === 0}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
            <p className="text-sm text-muted-foreground">
              Only clients who purchased this product will see this content
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Week 1: Upper Body Workout"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will clients learn from this content?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mediaUrl">Media URL</Label>
            <Input
              id="mediaUrl"
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-sm text-muted-foreground">
              Paste a YouTube, Vimeo, or direct video URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mediaType">Media Type</Label>
            <select
              id="mediaType"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="video">Video</option>
              <option value="article">Article</option>
              <option value="pdf">PDF</option>
              <option value="audio">Audio</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublished"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked as boolean)}
            />
            <Label htmlFor="isPublished" className="text-sm font-normal cursor-pointer">
              Publish immediately (make visible to clients)
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || products.length === 0}>
              {loading ? "Creating..." : "Create Content"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
