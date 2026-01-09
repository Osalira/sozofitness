import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/app");
  }

  // Not signed in → go to login
  redirect("/login");
}
