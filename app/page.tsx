import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect(`/${defaultLocale}/app`);
  }

  // Not signed in → go to login
  redirect(`/${defaultLocale}/login`);
}
