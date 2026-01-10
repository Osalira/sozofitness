import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { type Locale } from "@/lib/i18n/config";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const session = await getSession();
  const { locale } = await params;

  if (session) {
    // Redirect to /app which will then redirect based on role
    redirect(`/${locale}/app`);
  }

  // Not signed in → go to login
  redirect(`/${locale}/login`);
}

