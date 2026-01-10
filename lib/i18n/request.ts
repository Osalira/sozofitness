import { headers } from "next/headers";
import { defaultLocale, isValidLocale, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  // Check if URL starts with /fr
  if (pathname.startsWith("/fr")) {
    return "fr";
  }

  // Check cookie
  const cookieHeader = headersList.get("cookie") || "";
  const localeCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("NEXT_LOCALE="));

  if (localeCookie) {
    const locale = localeCookie.split("=")[1];
    if (isValidLocale(locale)) {
      return locale;
    }
  }

  return defaultLocale;
}

