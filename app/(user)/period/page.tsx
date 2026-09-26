"use client";

import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiTrash2,
} from "react-icons/fi";
import {
  type DynamicColumn,
  DynamicTable,
  iconButton,
} from "../../components/ui/DynamicTable";
import Loading from "../../components/ui/Loading";
import { PeriodFormModal } from "./_components/PeriodFormModal";
import { usePeriods } from "./_hooks/usePeriod";
import type { Period } from "./_types";

export default function PeriodPage() {
  const {
    periods,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchPeriods,
    handleRefresh,
    handleCreate,
    handleDelete,
    handleToggleStatus,
  } = usePeriods();

  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  if (loading && periods.length === 0) {
    return <Loading skeleton />;
  }

  const handleCreateAndClose = async (data: {
    label: string;
    startDate: string;
    endDate: string;
    schoolYearId: number;
  }) => {
    await handleCreate(data);
    setIsFormOpen(false);
  };

  const columns: DynamicColumn<Period>[] = [
    { key: "#", header: "#", hideable: false },
    {
      key: "label",
      header: "Intitulé",
      sortable: true,
      sortValue: (item) => item.label,
      render: (item) => (
        <div className="leading-tight">
          <p className="font-semibold text-slate-800">{item.label}</p>
          {item.schoolYear && (
            <p className="mt-0.5 text-xs text-slate-400">
              {item.schoolYear.label}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "startDate",
      header: "Début",
      sortable: true,
      sortValue: (item) => item.startDate,
      render: (item) => (
        <span className="whitespace-nowrap text-slate-600">
          {new Date(item.startDate).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "endDate",
      header: "Fin",
      sortable: true,
      sortValue: (item) => item.endDate,
      render: (item) => (
        <span className="whitespace-nowrap text-slate-600">
          {new Date(item.endDate).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      sortable: true,
      sortValue: (item) => item.status,
      render: (item) => (
        <span
          className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${
            item.status === "DRAFT"
              ? "bg-blue-50 text-blue-700 border-blue-100"
              : "bg-slate-50 text-slate-600 border-slate-200"
          }`}
        >
          {item.status === "DRAFT" ? "Brouillon" : "Clôturée"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      hideable: false,
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={() => handleToggleStatus(item.periodId, item.status)}
            title={item.status === "DRAFT" ? "Clôturer" : "Rouvrir"}
            aria-label={`${item.status === "DRAFT" ? "Clôturer" : "Rouvrir"} ${item.label}`}
            className={iconButton}
          >
            {item.status === "DRAFT" ? (
              <FiCheckCircle size={15} />
            ) : (
              <FiRotateCcw size={15} />
            )}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(item.periodId)}
            title="Supprimer"
            aria-label={`Supprimer ${item.label}`}
            className={`${iconButton} hover:bg-red-50 hover:text-red-600`}
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Academic period management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Define and manage periods within academic years.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-all"
            >
              <FiPlus />
              New period
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Toasts */}
        <div className="fixed top-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
          {error && (
            <div className="pointer-events-auto flex items-center gap-3 bg-white border border-red-100 text-red-600 px-4 py-3 rounded-2xl shadow-sm text-sm">
              <FiAlertCircle className="shrink-0" />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-3 text-gray-400 hover:text-gray-700"
              >
                ×
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
                className="ml-3 text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* List */}
        <DynamicTable
          columns={columns}
          data={periods}
          keyExtractor={(item) => item.periodId}
          isLoading={loading}
          countLabel="périodes"
          searchText={(item) =>
            `${item.label} ${new Date(item.startDate).toLocaleDateString("fr-FR")} ${new Date(
              item.endDate,
            ).toLocaleDateString("fr-FR")} ${item.schoolYear?.label ?? ""}`
          }
          emptyTitle="Aucune période trouvée"
          emptyMessage="Créez votre première période pour l’année scolaire active."
        />
      </div>

      <PeriodFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateAndClose}
        onError={(msg) => setError(msg)}
      />
    </div>
  );
}
