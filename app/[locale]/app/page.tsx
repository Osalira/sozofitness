import { requireAuth } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { type Locale } from "@/lib/i18n/config";

export default async function AppPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const session = await requireAuth();
  const { locale } = await params;

  // Redirect based on role (with locale prefix)
  if (session.user.role === UserRole.coach) {
    redirect(`/${locale}/coach`);
  } else if (session.user.role === UserRole.client) {
    redirect(`/${locale}/client`);
  } else if (session.user.role === UserRole.admin) {
    redirect(`/${locale}/admin`);
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
