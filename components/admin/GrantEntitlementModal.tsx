"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GrantEntitlementModal({
  userId,
  userEmail,
  open,
  onOpenChange,
  onSuccess,
}: GrantEntitlementModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [validityDays, setValidityDays] = useState("365");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

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

      toast.success("Entitlement granted successfully!");
      onSuccess();
      onOpenChange(false);
      // Reset form
      setValidityDays("365");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grant entitlement");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Grant Entitlement</DialogTitle>
          <DialogDescription>For: {userEmail}</DialogDescription>
        </DialogHeader>

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
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.coach.user.name || "Coach"}) - {product.type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validityDays">Validity Period</Label>
            <select
              id="validityDays"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Indefinite (no expiration)</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>

          <Alert>
            <AlertDescription>
              ⚠️ <strong>Warning:</strong> This will grant immediate access to the product. Source
              type will be "admin" and bypass payment.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !productId}>
              {loading ? "Granting..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
