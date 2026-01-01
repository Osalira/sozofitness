import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * Get the current session (server-side only)
 * Returns null if not authenticated
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication - redirects to login if not authenticated
 * Returns the session if authenticated
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  return session;
}

/**
 * Require specific role(s) - redirects if user doesn't have required role
 * @param allowedRoles - Single role or array of allowed roles
 */
export async function requireRole(allowedRoles: UserRole | UserRole[]) {
  const session = await requireAuth();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.user.role)) {
    // Redirect based on user's actual role
    if (session.user.role === UserRole.coach) {
      redirect("/coach");
    } else if (session.user.role === UserRole.client) {
      redirect("/client");
    } else {
      redirect("/app");
    }
  }

  return session;
}

/**
 * Get current user or null
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole) {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
