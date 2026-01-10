import type { Locale } from "./config";

/**
 * Format date/time with locale awareness
 */
export function formatDateTime(date: Date, locale: Locale, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", options).format(date);
}

/**
 * Format date only
 */
export function formatDate(date: Date, locale: Locale) {
  return formatDateTime(date, locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format time only
 */
export function formatTime(date: Date, locale: Locale) {
  return formatDateTime(date, locale, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format full date and time
 */
export function formatFullDateTime(date: Date, locale: Locale) {
  return formatDateTime(date, locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format currency
 */
export function formatCurrency(cents: number, currency: string = "usd", locale: Locale = "en") {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

