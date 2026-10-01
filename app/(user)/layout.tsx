"use client";

import { useState } from "react";
import { Header, MobileDrawer, Sidebar } from "../components/layout";
import { UserProvider } from "../context/userContext";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-300">
        <Sidebar />
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <Header
          onToggleMenu={() => setIsMobileMenuOpen((v) => !v)}
          isOpen={isMobileMenuOpen}
        />
        <main className="pt-16 lg:ml-64 px-1 py-6">
          <div className="bg-gray-200 text-black min-h-[calc(100vh-8rem)] p-5">
            {children}
          </div>
        </main>
      </div>
    </UserProvider>
  );
}
