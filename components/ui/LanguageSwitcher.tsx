"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLocale } from "@/lib/i18n/client";
import { locales, type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = async (newLocale: Locale) => {
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year

    // Update user preference in database if logged in
    try {
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLocale: newLocale }),
      });
    } catch (err) {
      // Silently fail if not logged in or API error
      console.log("Could not update user locale preference:", err);
    }

    startTransition(() => {
      // Remove current locale from pathname if exists
      let newPathname = pathname;
      for (const loc of locales) {
        if (pathname.startsWith(`/${loc}`)) {
          newPathname = pathname.slice(`/${loc}`.length) || "/";
          break;
        }
      }

      // Add new locale prefix if not default
      if (newLocale !== "en") {
        newPathname = `/${newLocale}${newPathname}`;
      }

      router.push(newPathname);
      router.refresh();
    });
  };

  return (
    <div className="relative inline-block">
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value as Locale)}
        disabled={isPending}
        className="flex h-9 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Select language"
      >
        <option value="en">🇺🇸 EN</option>
        <option value="fr">🇫🇷 FR</option>
      </select>
    </div>
  );
}

