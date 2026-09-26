"use client";

import { useState } from "react";
import { Footer, Header, MobileDrawer, Sidebar } from "../components/layout";
import { UserProvider } from "../context/userContext";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <UserProvider>
      <div className="min-h-screen graph-paper">
        <Sidebar />
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <Header
          onToggleMenu={() => setIsMobileMenuOpen((v) => !v)}
          isOpen={isMobileMenuOpen}
        />
        <main className="pt-16 lg:ml-64 px-2 py-6 md:px-5">
          <div className="text-slate-900 min-h-[calc(100vh-8rem)]">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </UserProvider>
  );
}
