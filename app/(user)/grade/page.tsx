"use client";

import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import {
  type DynamicColumn,
  DynamicTable,
  iconButton,
} from "../../components/ui/DynamicTable";
import Loading from "../../components/ui/Loading";
import { Modal } from "../../components/ui/Modal";
import { GradeForm } from "./_components/GradeForm";
import { useGrades } from "./_hooks/useGrade";
import type { Grade } from "./_types";

export default function GradePage() {
  const {
    grades,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchGrades,
    handleRefresh,
    handleCreate,
    handleDelete,
  } = useGrades();
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  if (loading && grades.length === 0) {
    return <Loading skeleton />;
  }

  const handleCreateAndClose = async (data: {
    value: number;
    maxScore: number;
    comment?: string;
    studentId: number;
    periodId: number;
    assignmentId: number;
    assessmentId?: number;
  }) => {
    await handleCreate(data);
    setIsFormOpen(false);
  };

  const columns: DynamicColumn<Grade>[] = [
    { key: "#", header: "#", hideable: false },
    {
      key: "student",
      header: "Étudiant",
      sortable: true,
      sortValue: (item) =>
        `${item.student?.firstname ?? ""} ${item.student?.lastname ?? ""}`,
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold uppercase text-white">
            {item.student
              ? `${item.student.firstname?.[0] ?? ""}${item.student.lastname?.[0] ?? ""}`
              : "?"}
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-slate-800">
              {item.student
                ? `${item.student.firstname} ${item.student.lastname}`
                : "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "assignment",
      header: "Évaluation",
      sortable: true,
      sortValue: (item) => item.assignment?.course?.name ?? "",
      render: (item) => (
        <span className="flex items-center gap-2 text-slate-600">
          <FiBookOpen className="text-slate-400" size={14} />
          {item.assignment?.course?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "period",
      header: "Période",
      sortable: true,
      sortValue: (item) => item.period?.label ?? "",
      render: (item) => (
        <span className="text-slate-600">{item.period?.label ?? "—"}</span>
      ),
    },
    {
      key: "score",
      header: "Note",
      sortable: true,
      sortValue: (item) => item.value,
      render: (item) => {
        const ratio =
          item.maxScore > 0 ? (item.value / item.maxScore) * 100 : 0;
        const tone =
          ratio >= 50
            ? "bg-green-50 text-green-700 border-green-100"
            : "bg-orange-50 text-orange-700 border-orange-100";
        return (
          <span
            className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
          >
            {item.value} / {item.maxScore}
          </span>
        );
      },
    },
    {
      key: "createdBy",
      header: "Saisie par",
      render: (item) => (
        <span className="flex items-center gap-1.5 text-slate-600">
          <FiUser className="text-slate-400" size={14} />
          {item.createdBy
            ? `${item.createdBy.name} ${item.createdBy.lastname}`
            : "—"}
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
            onClick={() => handleDelete(item.gradeId)}
            title="Supprimer"
            aria-label={`Supprimer la note de ${item.student?.firstname ?? ""}`}
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
              Grade management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Record and manage student grades.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-all"
            >
              <FiPlus />
              New grade
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
          data={grades}
          keyExtractor={(item) => item.gradeId}
          isLoading={loading}
          countLabel="notes"
          searchText={(item) =>
            `${item.student?.firstname ?? ""} ${item.student?.lastname ?? ""} ${
              item.assignment?.course?.name ?? ""
            } ${item.period?.label ?? ""} ${item.comment ?? ""}`
          }
          emptyTitle="Aucune note trouvée"
          emptyMessage="Saisissez la première note d’un étudiant."
        />
      </div>

      <Modal
        open={isFormOpen}
        title="New grade"
        label="New grade"
        onClose={() => setIsFormOpen(false)}
        icon={
          <div className="p-2 bg-gray-900 rounded-xl">
            <FiPlus className="text-white text-sm" />
          </div>
        }
      >
        <GradeForm
          onSubmit={handleCreateAndClose}
          onError={(msg) => setError(msg)}
        />
      </Modal>
    </div>
  );
}
