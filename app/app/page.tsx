import { requireAuth } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function AppPage() {
  const session = await requireAuth();

  // Redirect based on role
  if (session.user.role === UserRole.coach) {
    redirect("/coach");
  } else if (session.user.role === UserRole.client) {
    redirect("/client");
  } else if (session.user.role === UserRole.admin) {
    redirect("/admin");
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
