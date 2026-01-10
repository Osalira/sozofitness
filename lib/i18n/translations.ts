import type { Locale } from "./config";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";

const messages = {
  en: enMessages,
  fr: frMessages,
} as const;

export type Messages = typeof enMessages;
export type MessageKey = keyof Messages;

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<Messages>;

export function getTranslations(locale: Locale) {
  return messages[locale];
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const translations = messages[locale];
  const keys = key.split(".");

  let value: any = translations;
  for (const k of keys) {
    value = value?.[k];
  }

  if (typeof value !== "string") {
    console.warn(`Translation missing for key: ${key} (locale: ${locale})`);
    return key;
  }

  // Simple parameter replacement
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return value;
}

