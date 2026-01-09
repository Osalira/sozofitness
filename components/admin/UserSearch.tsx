"use client";

import { useState } from "react";
import { GrantEntitlementModal } from "./GrantEntitlementModal";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

interface Order {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
  product: { name: string };
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  product: { name: string };
}

interface Entitlement {
  id: string;
  sourceType: string;
  validUntil: string | null;
  isActive: boolean;
  product: { name: string };
}

interface UserDetails {
  user: User;
  orders: Order[];
  subscriptions: Subscription[];
  entitlements: Entitlement[];
}

export function UserSearch() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [showGrantModal, setShowGrantModal] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setUserDetails(null);

    try {
      const response = await fetch(`/api/admin/users/search?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search");
      }

      setUserDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeEntitlement = async (entitlementId: string) => {
    if (!confirm("Are you sure you want to revoke this entitlement?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/entitlements/${entitlementId}/revoke`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to revoke");
      }

      // Refresh user details
      handleSearch(new Event("submit") as any);
    } catch (err) {
      alert("Failed to revoke entitlement");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Search by email..."
            className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* User Details */}
      {userDetails && (
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {userDetails.user.name || "No name"}
                </h3>
                <p className="text-gray-600">{userDetails.user.email}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {userDetails.user.role}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Joined: {new Date(userDetails.user.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Orders ({userDetails.orders.length})
            </h3>
            {userDetails.orders.length === 0 ? (
              <p className="text-gray-600">No orders</p>
            ) : (
              <div className="space-y-2">
                {userDetails.orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{order.product.name}</span>
                      <span className="font-semibold">${(order.amountCents / 100).toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {order.status} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subscriptions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Subscriptions ({userDetails.subscriptions.length})
            </h3>
            {userDetails.subscriptions.length === 0 ? (
              <p className="text-gray-600">No subscriptions</p>
            ) : (
              <div className="space-y-2">
                {userDetails.subscriptions.map((sub) => (
                  <div key={sub.id} className="border border-gray-200 rounded p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{sub.product.name}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          sub.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Renews: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entitlements */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Entitlements ({userDetails.entitlements.length})
              </h3>
              <button
                onClick={() => setShowGrantModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
              >
                + Grant Access
              </button>
            </div>

            {userDetails.entitlements.length === 0 ? (
              <p className="text-gray-600">No entitlements</p>
            ) : (
              <div className="space-y-2">
                {userDetails.entitlements.map((ent) => (
                  <div key={ent.id} className="border border-gray-200 rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium">{ent.product.name}</span>
                        <p className="text-sm text-gray-500">
                          Source: {ent.sourceType} •
                          {ent.validUntil
                            ? ` Expires: ${new Date(ent.validUntil).toLocaleDateString()}`
                            : " Indefinite"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            ent.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {ent.isActive ? "Active" : "Inactive"}
                        </span>
                        {ent.isActive && (
                          <button
                            onClick={() => handleRevokeEntitlement(ent.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showGrantModal && userDetails && (
        <GrantEntitlementModal
          userId={userDetails.user.id}
          userEmail={userDetails.user.email}
          onClose={() => setShowGrantModal(false)}
          onSuccess={() => {
            setShowGrantModal(false);
            handleSearch(new Event("submit") as any);
          }}
        />
      )}
    </div>
  );
}
