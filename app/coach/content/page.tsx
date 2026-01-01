import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { ContentList } from "@/components/coach/ContentList";
import { CoachNav } from "@/components/navigation/CoachNav";

export default async function CoachContentPage() {
  const session = await requireRole(UserRole.coach);

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Content</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage videos and materials for your subscription products
              </p>
            </div>
          </div>

          <ContentList />
        </div>
      </main>
    </div>
  );
}
