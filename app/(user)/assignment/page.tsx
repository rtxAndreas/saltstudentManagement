"use client";

import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import {
  type DynamicColumn,
  DynamicTable,
  iconButton,
} from "../../components/ui/DynamicTable";
import Loading from "../../components/ui/Loading";
import { Modal } from "../../components/ui/Modal";
import { AssignmentForm } from "./_components/AssignmentForm";
import { useAssignments } from "./_hooks/useAssignment";
import type { Assignment } from "./_types";

export default function AssignmentPage() {
  const {
    assignments,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchAssignments,
    handleRefresh,
    handleCreate,
    handleDelete,
  } = useAssignments();
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  if (loading && assignments.length === 0) {
    return <Loading skeleton />;
  }

  const handleCreateAndClose = async (data: {
    teacherId: number;
    classId: number;
    courseId: number;
    schoolYearId: number;
  }) => {
    await handleCreate(data);
    setIsFormOpen(false);
  };

  const columns: DynamicColumn<Assignment>[] = [
    { key: "#", header: "#", hideable: false },
    {
      key: "teacher",
      header: "Enseignant",
      sortable: true,
      sortValue: (item) =>
        `${item.teacher?.name ?? ""} ${item.teacher?.lastname ?? ""}`,
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold uppercase text-white">
            {item.teacher
              ? `${item.teacher.name?.[0] ?? ""}${item.teacher.lastname?.[0] ?? ""}`
              : "?"}
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-slate-800">
              {item.teacher
                ? `${item.teacher.name} ${item.teacher.lastname}`
                : "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "class",
      header: "Classe",
      sortable: true,
      sortValue: (item) => item.class?.name ?? "",
      render: (item) => (
        <span className="flex items-center gap-2 text-slate-600">
          <FiLayers className="text-slate-400" size={14} />
          {item.class?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "course",
      header: "Cours",
      sortable: true,
      sortValue: (item) => item.course?.name ?? "",
      render: (item) => (
        <span className="flex items-center gap-2 text-slate-600">
          <FiBookOpen className="text-slate-400" size={14} />
          {item.course ? (
            <>
              {item.course.name}
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
                {item.course.code}
              </span>
            </>
          ) : (
            "—"
          )}
        </span>
      ),
    },
    {
      key: "schoolYear",
      header: "Année scolaire",
      sortable: true,
      sortValue: (item) => item.schoolYear?.label ?? "",
      render: (item) => (
        <span className="text-slate-600">{item.schoolYear?.label ?? "—"}</span>
      ),
    },
    {
      key: "grades",
      header: "Notes",
      className: "text-center",
      render: (item) => (
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-600">
          {item.grades?.length ?? 0}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      hideable: false,
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => handleDelete(item.assignmentId)}
            title="Supprimer"
            aria-label={`Supprimer l’affectation ${item.assignmentId}`}
            className={`${iconButton} hover:bg-red-50 hover:text-red-600`}
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6 md:p-12 text-gray-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Assignment management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Assign teachers to classes and courses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-all"
            >
              <FiPlus />
              New assignment
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="fixed top-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
          {error && (
            <div className="pointer-events-auto flex items-center gap-3 bg-white border border-red-100 text-red-600 px-4 py-3 rounded-2xl shadow-sm text-sm">
              <FiAlertCircle className="shrink-0" />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-3 text-gray-400 hover:text-gray-700 font-bold"
              >
                <FiX size={14} />
              </button>
            </div>
          )}
          {success && (
            <div className="pointer-events-auto flex items-center gap-3 bg-white border border-green-100 text-green-700 px-4 py-3 rounded-2xl shadow-sm text-sm">
              <FiCheckCircle className="shrink-0" />
              <span>{success}</span>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="ml-3 text-gray-400 hover:text-gray-700 font-bold"
              >
                <FiX size={14} />
              </button>
            </div>
          )}
        </div>

        <DynamicTable
          columns={columns}
          data={assignments}
          keyExtractor={(item) => item.assignmentId}
          isLoading={loading}
          countLabel="affectations"
          searchText={(item) =>
            `${item.teacher?.name ?? ""} ${item.teacher?.lastname ?? ""} ${
              item.class?.name ?? ""
            } ${item.course?.name ?? ""} ${item.course?.code ?? ""} ${
              item.schoolYear?.label ?? ""
            }`
          }
          emptyTitle="Aucune affectation trouvée"
          emptyMessage="Affectez un enseignant à une classe et un cours."
        />
      </div>

      <Modal
        open={isFormOpen}
        title="New assignment"
        label="New assignment"
        onClose={() => setIsFormOpen(false)}
        icon={
          <div className="p-2 bg-gray-900 rounded-xl">
            <FiPlus className="text-white text-sm" />
          </div>
        }
      >
        <AssignmentForm
          onSubmit={handleCreateAndClose}
          onError={(msg) => setError(msg)}
        />
      </Modal>
    </div>
  );
}
