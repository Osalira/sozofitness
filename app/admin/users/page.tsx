import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { AdminNav } from "@/components/navigation/AdminNav";
import { UserSearch } from "@/components/admin/UserSearch";

export default async function AdminUsersPage() {
  const session = await requireRole(UserRole.admin);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Search users and manage entitlements
            </p>
          </div>

          <UserSearch />
        </div>
      </main>
    </div>
  );
}
