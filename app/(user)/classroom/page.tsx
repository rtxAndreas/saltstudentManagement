"use client";

import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiHash,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import {
  type DynamicColumn,
  DynamicTable,
  iconButton,
} from "../../components/ui/DynamicTable";
import Loading from "../../components/ui/Loading";
import { Modal } from "../../components/ui/Modal";
import { ClassroomForm } from "./_components/ClassroomForm";
import { useClassrooms } from "./_hooks/useClassroom";
import type { Classroom } from "./_types";

export default function ClassroomPage() {
  const {
    classrooms,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchClassrooms,
    handleRefresh,
    handleCreate,
    handleDelete,
  } = useClassrooms();
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  if (loading && classrooms.length === 0) {
    return <Loading skeleton />;
  }

  const handleCreateAndClose = async (data: {
    name: string;
    capacity?: number | undefined;
    building?: string | undefined;
  }) => {
    await handleCreate(data);
    setIsFormOpen(false);
  };

  const columns: DynamicColumn<Classroom>[] = [
    { key: "#", header: "#", hideable: false },
    {
      key: "name",
      header: "Nom",
      sortable: true,
      sortValue: (item) => item.name,
      render: (item) => (
        <span className="flex items-center gap-2 font-semibold text-slate-800">
          <span className="p-1.5 rounded-lg bg-gray-900 text-white">
            <FiHash size={13} />
          </span>
          {item.name}
        </span>
      ),
    },
    {
      key: "building",
      header: "Bâtiment",
      sortable: true,
      sortValue: (item) => item.building ?? "",
      render: (item) => (
        <span className="flex items-center gap-2 text-slate-600">
          <FiMapPin className="text-slate-400" size={14} />
          {item.building ?? "—"}
        </span>
      ),
    },
    {
      key: "capacity",
      header: "Capacité",
      sortable: true,
      sortValue: (item) => item.capacity ?? 0,
      className: "text-center",
      render: (item) => (
        <span className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
          {item.capacity ? `${item.capacity} places` : "Non précisée"}
        </span>
      ),
    },
    {
      key: "schedules",
      header: "Créneaux",
      className: "text-center",
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <FiUsers className="text-slate-400" size={14} />
          <span className="font-medium text-slate-700">
            {item._count?.schedules ?? 0}
          </span>
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
            onClick={() => handleDelete(item.classroomId)}
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
              Classroom management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage classrooms and their capacity for the timetable.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-all"
            >
              <FiPlus />
              New classroom
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
          data={classrooms}
          keyExtractor={(item) => item.classroomId}
          isLoading={loading}
          countLabel="salles"
          searchText={(item) => `${item.name} ${item.building ?? ""}`}
          emptyTitle="Aucune salle trouvée"
          emptyMessage="Créez votre première salle de classe."
        />
      </div>

      <Modal
        open={isFormOpen}
        title="New classroom"
        label="New classroom"
        onClose={() => setIsFormOpen(false)}
        icon={
          <div className="p-2 bg-gray-900 rounded-xl">
            <FiPlus className="text-white text-sm" />
          </div>
        }
      >
        <ClassroomForm
          onSubmit={handleCreateAndClose}
          onError={(msg) => setError(msg)}
        />
      </Modal>
    </div>
  );
}
