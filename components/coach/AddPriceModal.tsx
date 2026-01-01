"use client";

import { useState } from "react";
import { ProductType } from "@prisma/client";

interface Product {
  id: string;
  name: string;
  type: ProductType;
}

interface AddPriceModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPriceModal({ product, onClose, onSuccess }: AddPriceModalProps) {
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

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add price");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Add Price</h2>
            <p className="text-base text-gray-600">
              For <span className="font-semibold">{product.name}</span>
            </p>
          </div>
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
            <label htmlFor="amount" className="block text-base font-medium text-gray-900 mb-2">
              Price Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500 text-base">$</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="currency" className="block text-base font-medium text-gray-900 mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="usd">USD ($)</option>
              <option value="eur">EUR (€)</option>
              <option value="gbp">GBP (£)</option>
              <option value="cad">CAD ($)</option>
            </select>
          </div>

          {isSubscription && (
            <>
              <div>
                <label
                  htmlFor="interval"
                  className="block text-base font-medium text-gray-900 mb-2"
                >
                  Billing Interval *
                </label>
                <select
                  id="interval"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="intervalCount"
                  className="block text-base font-medium text-gray-900 mb-2"
                >
                  Interval Count
                </label>
                <input
                  id="intervalCount"
                  type="number"
                  min="1"
                  value={intervalCount}
                  onChange={(e) => setIntervalCount(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-2 text-sm text-gray-600">
                  Charge every {intervalCount} {interval}
                  {parseInt(intervalCount) > 1 ? "s" : ""}
                </p>
              </div>
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-base text-blue-900">
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
              disabled={loading || !amount}
              className="w-full sm:flex-1 px-6 py-3 text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Adding..." : "Add Price"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
