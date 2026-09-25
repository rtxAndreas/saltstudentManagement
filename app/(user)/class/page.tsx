"use client";

import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";
import {
  type DynamicColumn,
  DynamicTable,
  iconButton,
} from "../../components/ui/DynamicTable";
import Loading from "../../components/ui/Loading";
import { Modal } from "../../components/ui/Modal";
import { ClassForm } from "./_components/ClassForm";
import { useClasses } from "./_hooks/useClass";
import type { Class } from "./_types";

const statusBadge: Record<Class["status"], string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-100",
  INACTIVE: "bg-orange-50 text-orange-700 border-orange-100",
};

export default function ClassPage() {
  const {
    classes,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchClasses,
    handleRefresh,
    handleCreate,
    handleDelete,
    handleToggleStatus,
  } = useClasses();
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  if (loading && classes.length === 0) {
    return <Loading skeleton />;
  }

  const handleCreateAndClose = async (data: {
    name: string;
    level: string;
  }) => {
    await handleCreate(data);
    setIsFormOpen(false);
  };

  const columns: DynamicColumn<Class>[] = [
    { key: "#", header: "#", hideable: false },
    {
      key: "name",
      header: "Nom",
      sortable: true,
      sortValue: (item) => item.name,
      render: (item) => (
        <span className="font-semibold text-slate-800">{item.name}</span>
      ),
    },
    {
      key: "level",
      header: "Niveau",
      sortable: true,
      sortValue: (item) => item.level,
      render: (item) => (
        <span className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
          {item.level}
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
      key: "status",
      header: "Statut",
      render: (item) => (
        <span
          className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge[item.status]}`}
        >
          {item.status === "ACTIVE" ? "Active" : "Inactive"}
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
            onClick={() => handleToggleStatus(item.classId, item.status)}
            title={item.status === "ACTIVE" ? "Désactiver" : "Réactiver"}
            aria-label={`${item.status === "ACTIVE" ? "Désactiver" : "Réactiver"} ${item.name}`}
            className={iconButton}
          >
            {item.status === "ACTIVE" ? (
              <FiUserX size={15} />
            ) : (
              <FiUserCheck size={15} />
            )}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(item.classId)}
            title="Supprimer"
            aria-label={`Supprimer ${item.name}`}
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
              Class management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Define and manage school classes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-all"
            >
              <FiPlus />
              New class
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
                className="ml-3 text-gray-400 hover:text-gray-700 font-bold"
              >
                <FiX size={14} />
              </button>
            </div>
          )}
        </div>

        <DynamicTable
          columns={columns}
          data={classes}
          keyExtractor={(item) => item.classId}
          isLoading={loading}
          countLabel="classes"
          searchText={(item) =>
            `${item.name} ${item.level} ${item.schoolYear?.label ?? ""}`
          }
          emptyTitle="Aucune classe trouvée"
          emptyMessage="Créez votre première classe pour l’année scolaire active."
        />
      </div>

      <Modal
        open={isFormOpen}
        title="New class"
        label="New class"
        onClose={() => setIsFormOpen(false)}
        icon={
          <div className="p-2 bg-gray-900 rounded-xl">
            <FiPlus className="text-white text-sm" />
          </div>
        }
      >
        <ClassForm
          onSubmit={handleCreateAndClose}
          onError={(msg) => setError(msg)}
        />
      </Modal>
    </div>
  );
}
