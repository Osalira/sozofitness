"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SignOutButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function SignOutButton({ children, className }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      redirect: false, // We'll handle redirect manually
    });
    
    // Clear any client-side state
    localStorage.clear();
    sessionStorage.clear();
    
    // Hard redirect to login (forces page reload to clear all state)
    window.location.href = "/en/login";
  };

  return (
    <button onClick={handleSignOut} className={className}>
      {children}
    </button>
  );
}

