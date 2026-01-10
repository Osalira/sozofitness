import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { ProductList } from "@/components/coach/ProductList";
import { CoachNav } from "@/components/navigation/CoachNav";

export default async function CoachProductsPage() {
  const session = await requireRole(UserRole.coach);

  return (
    <div className="min-h-screen bg-background">
      <CoachNav userName={session.user.name} userEmail={session.user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground">My Products</h1>
              <p className="mt-2 text-base text-muted-foreground">
                Manage your subscriptions and 1:1 session offerings
              </p>
            </div>
          </div>

          <ProductList />
        </div>
      </main>
    </div>
  );
}
