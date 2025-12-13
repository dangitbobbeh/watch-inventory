"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./theme-toggle";

type NavProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  signOutAction: () => Promise<void>;
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/reports", label: "Reports" },
  { href: "/ai/chat", label: "AI Assistant" },
  { href: "/inventory/new", label: "Add Watch" },
  { href: "/trade", label: "Trade" },
  { href: "/import", label: "Import" },
];

export default function Nav({ user, signOutAction }: NavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
          >
            Watch Inventory
          </Link>

          {user ? (
            <>
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    active={
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href))
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
                  <ThemeToggle />
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-medium">
                    {user.name?.[0]?.toUpperCase() ||
                      user.email?.[0]?.toUpperCase() ||
                      "?"}
                  </div>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex items-center gap-2 lg:hidden">
                <ThemeToggle />
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NavLink href="/login" active={pathname === "/login"}>
                Sign in
              </NavLink>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {user && mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                  }
                  onClick={() => setMobileMenuOpen(false)}
                  mobile
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-medium">
                    {user.name?.[0]?.toUpperCase() ||
                      user.email?.[0]?.toUpperCase() ||
                      "?"}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </span>
                </div>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
  active,
  onClick,
  mobile = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  mobile?: boolean;
}) {
  const baseStyles = mobile
    ? "block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
    : "px-3 py-2 rounded-lg text-sm font-medium transition-colors";

  const activeStyles = active
    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800";

  return (
    <Link
      href={href}
      className={`${baseStyles} ${activeStyles}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
