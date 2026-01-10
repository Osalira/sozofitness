"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: string;
  email: string;
  name: string | null;
  phoneE164: string | null;
  smsOptIn: boolean;
  phoneVerifiedAt: string | null;
  emailOptIn: boolean;
  preferredLocale: string;
}

export function SettingsForm() {
  const t = useTranslations();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [preferredLocale, setPreferredLocale] = useState("en");
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
        setPreferredLocale(data.user.preferredLocale || "en");
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
          preferredLocale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      setUser(data.user);
      setSuccess(t("settings.settingsUpdated"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>;
  }

  const showSmsWarning = smsOptIn && !phoneE164.trim();

  return (
    <div className="bg-card rounded-lg shadow-md p-6 sm:p-8 border border-border">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Profile Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("settings.profile")}</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">{t("settings.email")}</Label>
              <Input
                id="email"
                type="email"
                value={user?.email}
                disabled
                className="bg-muted"
              />
              <p className="mt-1 text-sm text-muted-foreground">{t("settings.emailCannotChange")}</p>
            </div>

            <div>
              <Label htmlFor="name">{t("settings.name")}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("settings.yourName")}
              />
            </div>

            <div>
              <Label htmlFor="preferredLocale">{t("settings.preferredLanguage")}</Label>
              <select
                id="preferredLocale"
                value={preferredLocale}
                onChange={(e) => setPreferredLocale(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="en">{t("settings.english")}</option>
                <option value="fr">{t("settings.french")}</option>
              </select>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("settings.languageDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("settings.notificationPreferences")}</h2>

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
                  {t("settings.emailNotifications")}
                </span>
                <span className="block text-sm text-muted-foreground mt-1">
                  {t("settings.emailNotificationsDesc")}
                </span>
              </label>
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="phoneE164">{t("settings.phoneNumber")}</Label>
              <Input
                id="phoneE164"
                type="tel"
                value={phoneE164}
                onChange={(e) => setPhoneE164(e.target.value)}
                placeholder="+16045551234"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {t("settings.phoneFormat")}
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
                <span className="block text-base font-medium text-foreground">{t("settings.smsNotifications")}</span>
                <span className="block text-sm text-muted-foreground mt-1">
                  {t("settings.smsNotificationsDesc")}
                </span>
              </label>
            </div>

            {showSmsWarning && (
              <Alert>
                <AlertDescription>
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
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
                    <div>
                      <p className="font-medium">{t("settings.phoneRequired")}</p>
                      <p className="text-sm mt-1">
                        {t("settings.phoneRequiredDesc")}
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-border">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? t("settings.saving") : t("settings.saveChanges")}
          </Button>
        </div>
      </form>

      {/* Information Box */}
      <div className="mt-6 bg-primary/10 border border-primary rounded-lg p-4">
        <h3 className="text-base font-semibold text-primary mb-2">{t("settings.aboutNotifications")}</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• {t("settings.aboutNotificationsDesc.0")}</li>
          <li>• {t("settings.aboutNotificationsDesc.1")}</li>
          <li>• {t("settings.aboutNotificationsDesc.2")}</li>
          <li>• {t("settings.aboutNotificationsDesc.3", { email: user?.email || "" })}</li>
        </ul>
      </div>

      {/* Dev Test Buttons */}
      {/* {process.env.NODE_ENV !== "production" && (
        <div className="mt-6 bg-muted border border-border rounded-lg p-4">
          <h3 className="text-base font-semibold text-foreground mb-3">
            {t("settings.testNotifications")}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
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
            >
              {t("settings.sendTestEmail")}
            </Button>
            <Button
              type="button"
              variant="outline"
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
            >
              {t("settings.sendTestSms")}
            </Button>
          </div>
        </div>
      )} */}
    </div>
  );
}
