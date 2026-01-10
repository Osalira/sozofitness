"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useTranslations } from "@/lib/i18n/client";

interface AdminNavProps {
  userName?: string | null;
  userEmail: string;
}

export function AdminNav({ userName, userEmail }: AdminNavProps) {
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/admin", label: t("nav.dashboard") },
    { href: "/admin/users", label: t("nav.users") },
    { href: "/admin/stripe-events", label: t("nav.stripeEvents") },
    { href: "/admin/feedback", label: "Feedback" },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold text-foreground">SOZOFITNESS</span>
              <Badge variant="warning" className="text-xs">ADMIN</Badge>
            </Link>

            <div className="hidden md:flex md:ml-8 md:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm ${
                    isActive(link.href)
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-4">
            <span className="text-sm text-muted-foreground truncate max-w-[150px]">
              {userName || userEmail}
            </span>
            <LanguageSwitcher />
            <ThemeToggle />
            <SignOutButton className="text-sm text-primary hover:text-primary/90">
              {t("nav.signOut")}
            </SignOutButton>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted-foreground hover:text-foreground p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border pb-3">
            <div className="pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium ${
                    isActive(link.href)
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="pt-3 border-t border-border">
              <div className="px-3 py-2">
                <p className="text-sm text-foreground font-medium truncate">
                  {userName || userEmail}
                </p>
              </div>
              <SignOutButton className="block w-full text-left px-3 py-2 text-base font-medium text-primary hover:bg-accent">
                {t("nav.signOut")}
              </SignOutButton>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
