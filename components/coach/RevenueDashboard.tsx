"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  const calculateAvgOrder = (revenue: number, count: number) => {
    if (count === 0) return 0;
    return revenue / count;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
              <div className="h-10 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
              <div className="h-10 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 7 Days Card */}
        <Card className="border-l-4 border-l-success shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Last 7 Days
                  </h3>
                </div>
                <p className="text-5xl font-bold text-success mb-2">
                  {formatCurrency(metrics?.revenue7d || 0)}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    {metrics?.orderCount7d || 0} {metrics?.orderCount7d === 1 ? "sale" : "sales"}
                  </span>
                  {metrics && metrics.orderCount7d > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-info"></span>
                      Avg: {formatCurrency(calculateAvgOrder(metrics.revenue7d, metrics.orderCount7d))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 30 Days Card */}
        <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Last 30 Days
                  </h3>
                </div>
                <p className="text-5xl font-bold text-primary mb-2">
                  {formatCurrency(metrics?.revenue30d || 0)}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {metrics?.orderCount30d || 0} {metrics?.orderCount30d === 1 ? "sale" : "sales"}
                  </span>
                  {metrics && metrics.orderCount30d > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-info"></span>
                      Avg: {formatCurrency(calculateAvgOrder(metrics.revenue30d, metrics.orderCount30d))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="px-6 py-4 bg-muted/50 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Recent Sales</h3>
              {recentSales.length > 0 && (
                <Badge variant="secondary">{recentSales.length}</Badge>
              )}
            </div>
          </div>

          {recentSales.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">No Sales Yet</h4>
              <p className="text-muted-foreground mb-4">
                Create your first product to start earning
              </p>
              <Button asChild>
                <Link href="/coach/products">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Product
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {sale.client.name || "Client"}
                        </div>
                        <div className="text-xs text-muted-foreground">{sale.client.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground font-medium">{sale.product.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-success">
                          {formatCurrency(sale.amountCents, sale.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-muted-foreground">{formatDate(sale.createdAt)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
