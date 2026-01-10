"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Locale } from "./config";
import { translate, type Messages } from "./translations";

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const value: I18nContextValue = {
    locale,
    messages,
    t: (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslations() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslations must be used within I18nProvider");
  }
  return context.t;
}

export function useLocale() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useLocale must be used within I18nProvider");
  }
  return context.locale;
}

