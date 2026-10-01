"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useUser } from "../../context/userContext";
import SchoolYearSelector from "../SchoolYearSelector";
import Loading from "../ui/Loading";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

interface HeaderProps {
  onToggleMenu: () => void;
  isOpen: boolean;
}

export default function Header({ onToggleMenu, isOpen }: HeaderProps) {
  const isMounted = useIsMounted();
  const { userFormat, isLoading, logout } = useUser();

  if (!isMounted) return null;

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 bg-gray-200 shadow-md flex items-center justify-between px-4 lg:pl-68">
      {/* Mobile : hamburger + logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <HamburgerButton isOpen={isOpen} onClick={onToggleMenu} />
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🎟️</span>
          <span className="font-bold text-red-800">StudentManagement</span>
        </Link>
      </div>

      {/* Desktop : spacer (sidebar prend en charge le logo) */}
      <div className="hidden lg:block" />

      {/* Barre de recherche */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-gray-100 border border-gray-300 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
          />
        </div>
      </div>

      {/* Actions utilisateur */}
      <div className="flex items-center gap-6">
        <SchoolYearSelector />
        <UserActions
          isLoading={isLoading}
          userFormat={userFormat}
          onLogout={logout}
        />
      </div>
    </header>
  );
}

// ── Sous-composants internes ──────────────────────────────────────

function HamburgerButton({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className="flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
    >
      <span
        className={`block w-5 h-0.5 bg-gray-700 rounded transition-all duration-300 ${isOpen ? "rotate-45 translate-y-1.5" : ""}`}
      />
      <span
        className={`block w-5 h-0.5 bg-gray-700 rounded my-1 transition-all duration-300 ${isOpen ? "opacity-0" : ""}`}
      />
      <span
        className={`block w-5 h-0.5 bg-gray-700 rounded transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
      />
    </button>
  );
}

function UserActions({
  isLoading,
  userFormat,
  onLogout,
}: {
  isLoading: boolean;
  userFormat: { name?: string; email: string } | null;
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {isLoading ? (
        <Loading size={20} message="" />
      ) : (
        userFormat && (
          <span className="hidden sm:block text-sm text-gray-600 font-medium truncate max-w-[140px]">
            {userFormat.name ?? userFormat.email}
          </span>
        )
      )}
      <button
        type="button"
        onClick={onLogout}
        className="text-sm bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  );
}
