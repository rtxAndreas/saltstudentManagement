"use client";

import { useEffect } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { SchoolYearForm } from "./ShoolYearForm";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    label: string;
    startDate: string;
    endDate: string;
  }) => Promise<void>;
  onError: (msg: string) => void;
}

export function SchoolYearFormModal({
  open,
  onClose,
  onSubmit,
  onError,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="New school year"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") onClose();
      }}
    >
      <div className="relative my-8 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-xl">
              <FiPlus className="text-white text-sm" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              New school year
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          <SchoolYearForm onSubmit={onSubmit} onError={onError} />
        </div>
      </div>
    </div>
  );
}
