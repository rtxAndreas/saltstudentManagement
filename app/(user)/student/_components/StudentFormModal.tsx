"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import type { Student } from "../_types";
import { StudentForm } from "./StudentForm";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  student?: Student | null;
  onClose: () => void;
  onSubmit: (data: {
    lastname: string;
    firstname: string;
    gender: "MALE" | "FEMALE";
    birthDate: string;
    classId: number;
    registrationNumber?: string;
    birthPlace?: string;
    address?: string;
    parentPhone?: string;
    parentEmail?: string;
  }) => Promise<void>;
  onError: (msg: string) => void;
}

export function StudentFormModal({
  open,
  mode,
  student,
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
      aria-label={mode === "edit" ? "Modifier l’élève" : "Nouvel élève"}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") onClose();
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {mode === "edit" ? "Modifier l’élève" : "Nouvel élève"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          <StudentForm
            onSubmit={onSubmit}
            onError={onError}
            editingStudent={mode === "edit" ? (student ?? null) : null}
            onCancelEdit={onClose}
          />
        </div>
      </div>
    </div>
  );
}

interface DetailProps {
  student: Student | null;
  onClose: () => void;
}

const detailFields: Array<{
  key: keyof Student;
  label: string;
  format?: (value: unknown) => string;
}> = [
  { key: "registrationNumber", label: "Matricule" },
  { key: "lastname", label: "Nom" },
  { key: "firstname", label: "Prénom" },
  {
    key: "gender",
    label: "Genre",
    format: (value) => (value === "FEMALE" ? "Femme" : "Homme"),
  },
  {
    key: "birthDate",
    label: "Date de naissance",
    format: (value) => new Date(String(value)).toLocaleDateString("fr-FR"),
  },
  { key: "birthPlace", label: "Lieu de naissance" },
  { key: "address", label: "Adresse" },
  { key: "parentPhone", label: "Téléphone parent" },
  { key: "parentEmail", label: "Email parent" },
];

export function StudentDetailModal({ student, onClose }: DetailProps) {
  if (!student) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Détail de l’élève"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {student.firstname} {student.lastname}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX size={18} />
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-6 py-5 text-sm">
          {detailFields.map((field) => (
            <div key={field.key}>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {field.label}
              </dt>
              <dd className="mt-0.5 font-medium text-slate-700">
                {student[field.key]
                  ? field.format
                    ? field.format(student[field.key])
                    : String(student[field.key])
                  : "—"}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Classe
            </dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {student.class?.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Statut
            </dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {student.status === "ACTIVE" ? "Actif" : "Inactif"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
