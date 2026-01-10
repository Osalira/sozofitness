"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { useTranslations } from "@/lib/i18n/client";

interface ClientNavProps {
  userName?: string | null;
  userEmail: string;
}

export function ClientNav({ userName, userEmail }: ClientNavProps) {
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/client", label: t("nav.dashboard") },
    { href: "/discover", label: t("nav.discover") },
    { href: "/client/access", label: t("nav.myAccess") },
    { href: "/client/appointments", label: t("nav.appointments") },
    { href: "/settings", label: t("nav.settings") },
  ];

  const isActive = (href: string) => {
    if (href === "/client") {
      return pathname === "/client";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Nav */}
          <div className="flex items-center">
            <Link href="/client" className="text-lg sm:text-xl font-bold text-foreground">
              SOZOFITNESS
            </Link>

            {/* Desktop Navigation */}
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

          {/* Desktop User Menu */}
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

          {/* Mobile Menu Button */}
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

        {/* Mobile Menu */}
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
