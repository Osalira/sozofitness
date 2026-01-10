import { requireAuth } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { CoachNav } from "@/components/navigation/CoachNav";
import { ClientNav } from "@/components/navigation/ClientNav";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { translate } from "@/lib/i18n/translations";
import { getLocale } from "@/lib/i18n/request";

export default async function SettingsPage() {
  const session = await requireAuth();
  const locale = await getLocale();
  const t = (key: string) => translate(locale, key);

  return (
    <div className="min-h-screen bg-background">
      {session.user.role === UserRole.coach ? (
        <CoachNav userName={session.user.name} userEmail={session.user.email} />
      ) : (
        <ClientNav userName={session.user.name} userEmail={session.user.email} />
      )}

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("settings.title")}</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Manage your profile and notification preferences
            </p>
          </div>

          <SettingsForm />
        </div>
      </main>
    </div>
  );
}
