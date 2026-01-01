import { requireAuth } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { CoachNav } from "@/components/navigation/CoachNav";
import { ClientNav } from "@/components/navigation/ClientNav";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {session.user.role === UserRole.coach ? (
        <CoachNav userName={session.user.name} userEmail={session.user.email} />
      ) : (
        <ClientNav userName={session.user.name} userEmail={session.user.email} />
      )}

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Manage your profile and notification preferences
            </p>
          </div>

          <SettingsForm />
        </div>
      </main>
    </div>
  );
}
