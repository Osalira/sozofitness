"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  phoneE164: string | null;
  smsOptIn: boolean;
  phoneVerifiedAt: string | null;
  emailOptIn: boolean;
}

export function SettingsForm() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/me");
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setName(data.user.name || "");
        setPhoneE164(data.user.phoneE164 || "");
        setSmsOptIn(data.user.smsOptIn);
        setEmailOptIn(data.user.emailOptIn);
      }
    } catch (err) {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phoneE164: phoneE164.trim() || undefined,
          smsOptIn,
          emailOptIn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      setUser(data.user);
      setSuccess("Settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  const showSmsWarning = smsOptIn && !phoneE164.trim();

  return (
    <div className="bg-card rounded-lg shadow-md p-6 sm:p-8 border border-border">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-md p-4">
            <p className="text-base text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-accent border border-accent rounded-md p-4">
            <p className="text-base text-accent-foreground">{success}</p>
          </div>
        )}

        {/* Profile Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Profile</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-base font-medium text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user?.email}
                disabled
                className="w-full px-4 py-3 text-base border border-input rounded-md bg-muted text-muted-foreground"
              />
              <p className="mt-1 text-sm text-muted-foreground">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-base font-medium text-foreground mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-base border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your name"
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h2>

          <div className="space-y-4">
            {/* Email Opt-In */}
            <div className="flex items-start">
              <input
                id="emailOptIn"
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                className="h-5 w-5 mt-0.5 text-primary focus:ring-ring border-input rounded"
              />
              <label htmlFor="emailOptIn" className="ml-3">
                <span className="block text-base font-medium text-foreground">
                  Email Notifications
                </span>
                <span className="block text-sm text-muted-foreground mt-1">
                  Receive appointment reminders and updates via email
                </span>
              </label>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneE164" className="block text-base font-medium text-foreground mb-2">
                Phone Number
              </label>
              <input
                id="phoneE164"
                type="tel"
                value={phoneE164}
                onChange={(e) => setPhoneE164(e.target.value)}
                className="w-full px-4 py-3 text-base border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="+16045551234"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                E.164 format required: +[country code][number] (e.g., +16045551234 for US/Canada)
              </p>
            </div>

            {/* SMS Opt-In */}
            <div className="flex items-start">
              <input
                id="smsOptIn"
                type="checkbox"
                checked={smsOptIn}
                onChange={(e) => setSmsOptIn(e.target.checked)}
                className="h-5 w-5 mt-0.5 text-primary focus:ring-ring border-input rounded"
              />
              <label htmlFor="smsOptIn" className="ml-3">
                <span className="block text-base font-medium text-foreground">SMS Notifications</span>
                <span className="block text-sm text-muted-foreground mt-1">
                  Receive appointment reminders via text message
                </span>
              </label>
            </div>

            {showSmsWarning && (
              <div className="bg-accent border border-accent rounded-md p-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-accent-foreground mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="ml-3">
                    <p className="text-base font-medium text-accent-foreground">Phone number required</p>
                    <p className="text-sm text-accent-foreground mt-1">
                      SMS notifications are enabled but no phone number is set. Please add your
                      phone number above.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 text-base bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Information Box */}
      <div className="mt-6 bg-primary/10 border border-primary rounded-lg p-4">
        <h3 className="text-base font-semibold text-primary mb-2">About Notifications</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• You'll receive reminders 5 days and 24 hours before appointments</li>
          <li>• SMS reminders include meeting links for quick access</li>
          <li>• Reply STOP to any SMS to opt out</li>
          <li>• Email notifications are sent to {user?.email}</li>
        </ul>
      </div>

      {/* Dev Test Buttons */}
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-6 bg-muted border border-border rounded-lg p-4">
          <h3 className="text-base font-semibold text-foreground mb-3">
            Test Notifications (Dev Only)
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch("/api/dev/test-email", { method: "POST" });
                  const data = await res.json();
                  if (res.ok) {
                    alert("✅ Test email sent! Check your inbox.");
                  } else {
                    alert(`❌ ${data.error}`);
                  }
                } catch (err) {
                  alert("❌ Failed to send test email");
                }
              }}
              className="px-4 py-2 text-sm bg-card border border-input rounded-md hover:bg-accent font-medium"
            >
              Send Test Email
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!user?.smsOptIn || !user?.phoneE164) {
                  alert("❌ Enable SMS and add phone number first");
                  return;
                }
                try {
                  const res = await fetch("/api/dev/test-sms", { method: "POST" });
                  const data = await res.json();
                  if (res.ok) {
                    alert(`✅ Test SMS sent to ${user.phoneE164}!`);
                  } else {
                    alert(`❌ ${data.error}`);
                  }
                } catch (err) {
                  alert("❌ Failed to send test SMS");
                }
              }}
              className="px-4 py-2 text-sm bg-card border border-input rounded-md hover:bg-accent font-medium"
            >
              Send Test SMS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
