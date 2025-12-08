import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

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
            {session ? (
              <div className="flex items-center gap-6">
                <NavLink href="/">Dashboard</NavLink>
                <NavLink href="/inventory">Inventory</NavLink>
                <NavLink href="/reports">Reports</NavLink>
                <NavLink href="/ai/chat">AI Chat</NavLink>
                <NavLink href="/ai/pricing">AI Pricing</NavLink>
                <NavLink href="/ai/advisor">AI Advisor</NavLink>
                <NavLink href="/inventory/new">Add Watch</NavLink>
                <NavLink href="/import">Import</NavLink>
                <div className="flex items-center gap-3 ml-4 pl-4 border-l">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/login" });
                    }}
                  >
                    <button
                      type="submit"
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <NavLink href="/login">Sign in</NavLink>
            )}
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
