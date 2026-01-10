import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getTranslations } from "@/lib/i18n/translations";
import { I18nProvider } from "@/lib/i18n/client";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = getTranslations(locale as Locale);
  const session = await getServerSession(authOptions);

  return (
    <I18nProvider locale={locale as Locale} messages={messages}>
      <div lang={locale}>
        {children}
        {/* Show feedback button only for authenticated users */}
        {session && <FeedbackButton />}
      </div>
    </I18nProvider>
  );
}

