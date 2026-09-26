"use client";

import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiHash,
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
import { CourseForm } from "./_components/CourseForm";
import { useCourses } from "./_hooks/usecourse";
import type { Course } from "./_types";

const statusBadge: Record<Course["statusCourse"], string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-100",
  INACTIVE: "bg-orange-50 text-orange-700 border-orange-100",
};

export default function CoursePage() {
  const {
    courses,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchCourses,
    handleRefresh,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useCourses();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading && courses.length === 0) {
    return <Loading skeleton />;
  }

  const handleSubmit = async (data: {
    name: string;
    code: string;
    coefficient: number;
    classIds: number[];
  }) => {
    if (editingCourse) {
      await handleUpdate(editingCourse.courseId, data);
    } else {
      await handleCreate(data);
    }
    setIsFormOpen(false);
  };

  const openCreate = () => {
    setEditingCourse(null);
    setIsFormOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const columns: DynamicColumn<Course>[] = [
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
      key: "code",
      header: "Code",
      sortable: true,
      sortValue: (item) => item.code,
      render: (item) => (
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
          {item.code}
        </span>
      ),
    },
    {
      key: "classes",
      header: "Classes",
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.classes.slice(0, 3).map((classItem) => (
            <span
              key={classItem.classId}
              className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
            >
              {classItem.name}
            </span>
          ))}
          {item.classes.length > 3 && (
            <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              +{item.classes.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "coefficient",
      header: "Coef.",
      sortable: true,
      sortValue: (item) => item.coefficient,
      className: "text-center",
      render: (item) => (
        <span className="text-slate-600">{item.coefficient}</span>
      ),
    },
    {
      key: "statusCourse",
      header: "Statut",
      sortable: true,
      sortValue: (item) => item.statusCourse,
      render: (item) => (
        <span
          className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge[item.statusCourse]}`}
        >
          {item.statusCourse === "ACTIVE" ? "Active" : "Inactive"}
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
            onClick={() => openEdit(item)}
            title="Modifier"
            aria-label={`Modifier ${item.name}`}
            className={iconButton}
          >
            <FiEdit3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(item.courseId)}
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
              Course management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Define and manage school courses and assign them to classes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-all"
            >
              <FiPlus />
              New course
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
          data={courses}
          keyExtractor={(item) => item.courseId}
          isLoading={loading}
          countLabel="cours"
          searchText={(item) =>
            `${item.name} ${item.code} ${item.classes.map((c) => c.name).join(" ")}`
          }
          emptyTitle="Aucun cours trouvé"
          emptyMessage="Créez votre premier cours et assignez-le à des classes."
        />
      </div>

      <Modal
        open={isFormOpen}
        title={editingCourse ? "Edit course" : "New course"}
        label={editingCourse ? "Edit course" : "New course"}
        onClose={() => setIsFormOpen(false)}
        icon={
          <div className="p-2 bg-gray-900 rounded-xl">
            <FiPlus className="text-white text-sm" />
          </div>
        }
      >
        <CourseForm
          onSubmit={handleSubmit}
          onError={(msg) => setError(msg)}
          editingCourse={editingCourse}
          onCancelEdit={() => setIsFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
