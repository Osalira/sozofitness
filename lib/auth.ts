import { AuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

// Extend NextAuth types to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        // 🔒 SECURITY: Auto-upgrade weak password hashes
        const currentRounds = bcrypt.getRounds(user.passwordHash);
        if (currentRounds < 12) {
          const newHash = await bcrypt.hash(credentials.password, 12);
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
          });
        }

        // Return user object that will be stored in JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 🔒 SECURITY: 7 days (was infinite)
    updateAge: 24 * 60 * 60, // 🔒 SECURITY: Refresh token daily if active
  },
  // 🔒 SECURITY: Secure cookie configuration
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true, // Prevent XSS access to cookie
        sameSite: "lax", // CSRF protection (strict breaks OAuth)
        path: "/",
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
      },
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
