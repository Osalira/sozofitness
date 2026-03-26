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
  emailOptIn: boolean;
  preferredLocale: string;
}

export function SettingsForm() {
  const t = useTranslations();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
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
        </ul>
      </div>
    </div>
  );
}
