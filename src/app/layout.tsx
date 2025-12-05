import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Watch Inventory",
  description: "Track your watch collection and sales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <nav className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 hover:text-gray-700"
            >
              Watch Inventory
            </Link>
            <div className="flex gap-6">
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/inventory">Inventory</NavLink>
              <NavLink href="/reports">Reports</NavLink>
              <NavLink href="/inventory/new">Add Watch</NavLink>
              <NavLink href="/import">Import</NavLink>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="text-gray-600 hover:text-gray-900 font-medium">
      {children}
    </Link>
  );
}
