"use client";

import { FiEdit2, FiEye, FiTrash2, FiUserCheck, FiUserX } from "react-icons/fi";
import type { Student } from "../_types";

export const HIDEABLE_COLUMNS = [
  { key: "matricule", label: "Matricule" },
  { key: "lastname", label: "Nom" },
  { key: "firstname", label: "Prénom" },
  { key: "class", label: "Classe" },
  { key: "gender", label: "Genre" },
  { key: "birthDate", label: "Date de naissance" },
  { key: "status", label: "Statut" },
] as const;

export type ColumnKey = (typeof HIDEABLE_COLUMNS)[number]["key"];

const SKELETON_ROWS = Array.from(
  { length: 6 },
  (_, index) => `skeleton-${index}`,
);

interface Props {
  students: Student[];
  loading: boolean;
  pageOffset: number;
  selectedIds: Set<number>;
  toggleSelect: (id: number) => void;
  toggleSelectAll: () => void;
  visibleColumns: Set<ColumnKey>;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onToggleStatus: (student: Student) => void;
  onDelete: (student: Student) => void;
}

const genderBadge: Record<
  Student["gender"],
  { label: string; className: string }
> = {
  FEMALE: {
    label: "Femme",
    className: "bg-pink-50 text-pink-700 border-pink-100",
  },
  MALE: {
    label: "Homme",
    className: "bg-blue-50 text-blue-700 border-blue-100",
  },
};

const statusBadge: Record<
  Student["status"],
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Actif",
    className: "bg-green-50 text-green-700 border-green-100",
  },
  INACTIVE: {
    label: "Inactif",
    className: "bg-orange-50 text-orange-700 border-orange-100",
  },
};

function initials(student: Student) {
  return `${student.firstname.charAt(0)}${student.lastname.charAt(0)}`.toUpperCase();
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
];

export function StudentTable({
  students,
  loading,
  pageOffset,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  visibleColumns,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: Props) {
  const show = (key: ColumnKey) => visibleColumns.has(key);
  const allSelected =
    students.length > 0 && selectedIds.size === students.length;

  const iconButton =
    "rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Tout sélectionner"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="accent-blue-600"
                />
              </th>
              <th className="w-10 px-2 py-3">#</th>
              <th className="w-14 px-2 py-3">Élève</th>
              {show("matricule") && <th className="px-3 py-3">Matricule</th>}
              {show("lastname") && <th className="px-3 py-3">Nom</th>}
              {show("firstname") && <th className="px-3 py-3">Prénom</th>}
              {show("class") && (
                <th className="hidden px-3 py-3 md:table-cell">Classe</th>
              )}
              {show("gender") && (
                <th className="hidden px-3 py-3 lg:table-cell">Genre</th>
              )}
              {show("birthDate") && (
                <th className="hidden px-3 py-3 lg:table-cell">Naissance</th>
              )}
              {show("status") && <th className="px-3 py-3">Statut</th>}
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && students.length === 0
              ? SKELETON_ROWS.map((rowKey) => (
                  <tr
                    key={rowKey}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td colSpan={11} className="px-4 py-3">
                      <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              : students.map((student, index) => (
                  <tr
                    key={student.studentId}
                    className={`border-b border-slate-50 transition-colors last:border-0 hover:bg-blue-50/40 ${
                      loading ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner ${student.firstname} ${student.lastname}`}
                        checked={selectedIds.has(student.studentId)}
                        onChange={() => toggleSelect(student.studentId)}
                        className="accent-blue-600"
                      />
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-400">
                      {pageOffset + index + 1}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          avatarColors[student.studentId % avatarColors.length]
                        }`}
                        title={`${student.firstname} ${student.lastname}`}
                      >
                        {initials(student)}
                      </span>
                    </td>
                    {show("matricule") && (
                      <td className="px-3 py-3 font-mono text-xs text-slate-500">
                        {student.registrationNumber ?? "—"}
                      </td>
                    )}
                    {show("lastname") && (
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {student.lastname}
                      </td>
                    )}
                    {show("firstname") && (
                      <td className="px-3 py-3 text-slate-700">
                        {student.firstname}
                      </td>
                    )}
                    {show("class") && (
                      <td className="hidden px-3 py-3 md:table-cell">
                        {student.class && (
                          <span className="whitespace-nowrap rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {student.class.name}
                          </span>
                        )}
                      </td>
                    )}
                    {show("gender") && (
                      <td className="hidden px-3 py-3 lg:table-cell">
                        <span
                          className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${genderBadge[student.gender].className}`}
                        >
                          {genderBadge[student.gender].label}
                        </span>
                      </td>
                    )}
                    {show("birthDate") && (
                      <td className="hidden px-3 py-3 text-slate-600 lg:table-cell">
                        {new Date(student.birthDate).toLocaleDateString(
                          "fr-FR",
                        )}
                      </td>
                    )}
                    {show("status") && (
                      <td className="px-3 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge[student.status].className}`}
                        >
                          {statusBadge[student.status].label}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => onView(student)}
                          title="Voir"
                          aria-label={`Voir ${student.firstname} ${student.lastname}`}
                          className={iconButton}
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(student)}
                          title="Modifier"
                          aria-label={`Modifier ${student.firstname} ${student.lastname}`}
                          className={iconButton}
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(student)}
                          title={
                            student.status === "ACTIVE"
                              ? "Désactiver"
                              : "Réactiver"
                          }
                          aria-label={`${student.status === "ACTIVE" ? "Désactiver" : "Réactiver"} ${student.firstname} ${student.lastname}`}
                          className={iconButton}
                        >
                          {student.status === "ACTIVE" ? (
                            <FiUserX size={15} />
                          ) : (
                            <FiUserCheck size={15} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(student)}
                          title="Supprimer"
                          aria-label={`Supprimer ${student.firstname} ${student.lastname}`}
                          className={`${iconButton} hover:bg-red-50 hover:text-red-600`}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={11} className="px-6 py-14 text-center">
                  <p className="font-semibold text-slate-700">
                    Aucun élève trouvé
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Essayez de modifier votre recherche ou vos filtres.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
