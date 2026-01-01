"use client";

import { useState, useEffect } from "react";

interface Metrics {
  revenue7d: number;
  orderCount7d: number;
  revenue30d: number;
  orderCount30d: number;
}

interface Sale {
  id: string;
  createdAt: string;
  amountCents: number;
  currency: string;
  client: {
    email: string;
    name: string | null;
  };
  product: {
    name: string;
  };
  price: {
    amountCents: number;
    currency: string;
  };
}

export function RevenueDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/coach/metrics");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch metrics");
      }

      setMetrics(data.metrics);
      setRecentSales(data.recentSales);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, currency: string = "usd") => {
    const amount = cents / 100;
    const symbol = currency === "usd" ? "$" : currency.toUpperCase();
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-600">Loading metrics...</div>
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
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Last 7 Days</h3>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(metrics?.revenue7d || 0)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {metrics?.orderCount7d || 0} {metrics?.orderCount7d === 1 ? "sale" : "sales"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Last 30 Days</h3>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(metrics?.revenue30d || 0)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {metrics?.orderCount30d || 0} {metrics?.orderCount30d === 1 ? "sale" : "sales"}
          </p>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
        </div>

        {recentSales.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-600">No sales yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sale.client.name || "Client"}
                      </div>
                      <div className="text-sm text-gray-500">{sale.client.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{sale.product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(sale.amountCents, sale.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(sale.createdAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
