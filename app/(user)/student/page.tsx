"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronDown,
  FiColumns,
  FiDownload,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { StudentFilters } from "./_components/StudentFilters";
import {
  StudentDetailModal,
  StudentFormModal,
} from "./_components/StudentFormModal";
import { StudentPagination } from "./_components/StudentPagination";
import { StudentStats } from "./_components/StudentStats";
import {
  type ColumnKey,
  HIDEABLE_COLUMNS,
  StudentTable,
} from "./_components/StudentTable";
import { useStudentDirectory } from "./_hooks/useStudentDirectory";
import type { Student } from "./_types";

export default function StudentPage() {
  const directory = useStudentDirectory();
  const {
    students,
    pagination,
    stats,
    loading,
    error,
    success,
    setError,
    setSuccess,
    page,
    setPage,
    limit,
    changeLimit,
    searchInput,
    setSearchInput,
    filters,
    updateFilter,
    resetFilters,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleStatus,
    handleBulkStatus,
  } = directory;

  const [modal, setModal] = useState<{
    mode: "create" | "edit" | "view";
    student: Student | null;
  } | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(HIDEABLE_COLUMNS.map((column) => column.key)),
  );
  const [classes, setClasses] = useState<
    Array<{ classId: number; name: string; level: string }>
  >([]);

  useEffect(() => {
    fetch("/api/class")
      .then((response) => response.json())
      .then((json) => setClasses(Array.isArray(json) ? json : []))
      .catch(() => undefined);
  }, []);

  const exportCsv = () => {
    const headers = [
      "Matricule",
      "Nom",
      "Prénom",
      "Classe",
      "Genre",
      "Naissance",
      "Statut",
    ];
    const lines = students.map((student) =>
      [
        student.registrationNumber ?? "",
        student.lastname,
        student.firstname,
        student.class?.name ?? "",
        student.gender === "FEMALE" ? "Femme" : "Homme",
        new Date(student.birthDate).toLocaleDateString("fr-FR"),
        student.status === "ACTIVE" ? "Actif" : "Inactif",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob(
      [`\uFEFF${[headers.join(";"), ...lines].join("\n")}`],
      {
        type: "text/csv;charset=utf-8",
      },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `eleves-page${page}-${limit}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        if (current.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectedCount = selectedIds.size;
  const pageOffset = (pagination.page - 1) * pagination.limit;
  const closeModal = () => setModal(null);

  const handleSubmit = async (data: {
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
  }) => {
    if (modal?.mode === "edit" && modal.student) {
      await handleUpdate(modal.student.studentId, data);
      closeModal();
    } else {
      await handleCreate(data);
      closeModal();
    }
  };

  const toasts = useMemo(
    () => (
      <div className="fixed top-6 right-6 z-[60] flex flex-col gap-2">
        {error && (
          <Toast tone="error" message={error} onClose={() => setError(null)} />
        )}
        {success && (
          <Toast
            tone="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}
      </div>
    ),
    [error, success, setError, setSuccess],
  );

  return (
    <div className="space-y-5">
      {toasts}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Gestion des élèves
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez l’inscription et les informations des élèves.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create", student: null })}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <FiPlus size={16} />
          Nouvel élève
        </button>
      </div>

      <StudentStats stats={stats} />

      <StudentFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        classes={classes}
      />

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
          <span className="font-semibold">{selectedCount} sélectionné(s)</span>
          <button
            type="button"
            onClick={() => handleBulkStatus("ACTIVE")}
            className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
          >
            Activer
          </button>
          <button
            type="button"
            onClick={() => handleBulkStatus("INACTIVE")}
            className="rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50"
          >
            Désactiver
          </button>
          <button
            type="button"
            onClick={() => {
              for (const id of selectedIds) handleDelete(id);
            }}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            Supprimer
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-500">
          {loading
            ? "Chargement…"
            : `${pagination.total.toLocaleString("fr-FR")} élève(s)`}
        </span>
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <FiDownload size={14} />
            Exporter
          </button>
          <button
            type="button"
            onClick={() => setColumnsOpen((current) => !current)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <FiColumns size={14} />
            Colonnes
            <FiChevronDown size={14} />
          </button>
          {columnsOpen && (
            <div className="absolute top-full right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Colonnes affichées
                </span>
                <button
                  type="button"
                  onClick={() => setColumnsOpen(false)}
                  aria-label="Fermer"
                  className="text-slate-400 hover:text-slate-700"
                >
                  <FiX size={14} />
                </button>
              </div>
              {HIDEABLE_COLUMNS.map((column) => (
                <label
                  key={column.key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(column.key)}
                    onChange={() => toggleColumn(column.key)}
                    className="accent-blue-600"
                  />
                  {column.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <StudentTable
        students={students}
        loading={loading}
        pageOffset={pageOffset}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        toggleSelectAll={toggleSelectAll}
        visibleColumns={visibleColumns}
        onView={(student) => setModal({ mode: "view", student })}
        onEdit={(student) => setModal({ mode: "edit", student })}
        onToggleStatus={(student) =>
          handleToggleStatus(student.studentId, student.status)
        }
        onDelete={(student) => handleDelete(student.studentId)}
      />

      <StudentPagination
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        onLimitChange={changeLimit}
      />

      <StudentFormModal
        open={modal?.mode === "create" || modal?.mode === "edit"}
        mode={modal?.mode === "edit" ? "edit" : "create"}
        student={modal?.student ?? null}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onError={(message) => setError(message)}
      />

      <StudentDetailModal
        student={modal?.mode === "view" ? modal.student : null}
        onClose={closeModal}
      />
    </div>
  );
}

function Toast({
  tone,
  message,
  onClose,
}: {
  tone: "error" | "success";
  message: string;
  onClose: () => void;
}) {
  const isError = tone === "error";
  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm ${
        isError
          ? "border-red-100 text-red-600"
          : "border-green-100 text-green-700"
      }`}
    >
      {isError ? (
        <FiAlertCircle className="shrink-0" />
      ) : (
        <FiCheckCircle className="shrink-0" />
      )}
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-3 font-bold text-gray-400 hover:text-gray-700"
      >
        x
      </button>
    </div>
  );
}
