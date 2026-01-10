"use client";

import { useState } from "react";
import { ProductType } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  type: ProductType;
}

interface AddPriceModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddPriceModal({ product, open, onOpenChange, onSuccess }: AddPriceModalProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [interval, setInterval] = useState("month");
  const [intervalCount, setIntervalCount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSubscription = product.type === ProductType.subscription;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue < 0) {
        throw new Error("Please enter a valid amount");
      }

      const amountCents = Math.round(amountValue * 100);

      const payload: any = {
        amountCents,
        currency,
      };

      if (isSubscription) {
        payload.interval = interval;
        payload.intervalCount = parseInt(intervalCount, 10);
      }

      const response = await fetch(`/api/coach/products/${product.id}/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add price");
      }

      toast.success("Price added successfully!");
      onSuccess();
      onOpenChange(false);
      // Reset form
      setAmount("");
      setCurrency("usd");
      setInterval("month");
      setIntervalCount("1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add price");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Price</DialogTitle>
          <DialogDescription>
            For <span className="font-semibold">{product.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">
              Price Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="usd">USD ($)</option>
              <option value="eur">EUR (€)</option>
              <option value="gbp">GBP (£)</option>
              <option value="cad">CAD ($)</option>
            </select>
          </div>

          {isSubscription && (
            <>
              <div className="space-y-2">
                <Label htmlFor="interval">
                  Billing Interval <span className="text-destructive">*</span>
                </Label>
                <select
                  id="interval"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intervalCount">Interval Count</Label>
                <Input
                  id="intervalCount"
                  type="number"
                  min="1"
                  value={intervalCount}
                  onChange={(e) => setIntervalCount(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Charge every {intervalCount} {interval}
                  {parseInt(intervalCount) > 1 ? "s" : ""}
                </p>
              </div>
            </>
          )}

          <Alert>
            <AlertDescription>
              {isSubscription ? (
                <>
                  Clients will be charged <strong>${amount || "0.00"}</strong> every{" "}
                  {intervalCount !== "1" ? `${intervalCount} ` : ""}
                  {interval}
                  {parseInt(intervalCount) > 1 ? "s" : ""}
                </>
              ) : (
                <>
                  Clients will pay <strong>${amount || "0.00"}</strong> for this 1:1 session
                </>
              )}
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount}>
              {loading ? "Adding..." : "Add Price"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
