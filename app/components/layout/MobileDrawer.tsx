"use client";

import NavLinks from "./NavLinks";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  return (
    <div
      className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <button
        type="button"
        aria-label="Close Menu overlay"
        onClick={onClose}
        className="fixed inset-0 w-full h-full bg-black/30 backdrop-blur-sm cursor-default"
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-200 shadow-2xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-300">
          <span className="font-bold text-gray-800 text-lg">
            Student Management
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="close menu"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-300 text-gray-600 transition-colors"
          >
            x
          </button>
        </div>
        <NavLinks onClose={onClose} />
      </aside>
    </div>
  );
}
