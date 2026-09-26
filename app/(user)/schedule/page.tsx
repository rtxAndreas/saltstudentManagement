"use client";

import { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiPlus, FiX } from "react-icons/fi";
import { useSchoolYear } from "@/app/context/SchoolYearContext";
import { useUser } from "@/app/context/userContext";
import { ScheduleFilters } from "./_components/ScheduleFilters";
import { ScheduleSlotModal } from "./_components/ScheduleSlotModal";
import { ScheduleWeek } from "./_components/ScheduleWeek";
import { useScheduleWeek } from "./_hooks/useScheduleWeek";
import type { Schedule } from "./_types";

export default function SchedulePage() {
  const {
    schedules,
    loading,
    error,
    success,
    clearToast,
    filters,
    updateFilter,
    resetFilters,
    saveSlot,
    cancelSlot,
    restoreSlot,
    deleteSlot,
  } = useScheduleWeek();
  const { selectedSchoolYearId } = useSchoolYear();
  const { userFormat, isAdmin } = useUser();
  const isInstructor = userFormat?.role === "INSTRUCTOR";
  const [modal, setModal] = useState<{ open: boolean; slot: Schedule | null }>({
    open: false,
    slot: null,
  });

  const [classes, setClasses] = useState<
    Array<{ classId: number; name: string; level: string }>
  >([]);
  const [teachers, setTeachers] = useState<
    Array<{ userId: number; name: string; lastname: string }>
  >([]);
  const [classrooms, setClassrooms] = useState<
    Array<{ classroomId: number; name: string }>
  >([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/class").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/classroom").then((r) => r.json()),
    ])
      .then(([c, u, cr]) => {
        setClasses(Array.isArray(c) ? c : []);
        setTeachers(
          Array.isArray(u)
            ? u.filter((item: { role: string }) => item.role === "INSTRUCTOR")
            : [],
        );
        setClassrooms(Array.isArray(cr) ? cr : []);
      })
      .catch(() => undefined);
  }, []);

  const levels = useMemo(
    () => [...new Set(classes.map((item) => item.level))].sort(),
    [classes],
  );

  return (
    <div className="space-y-5">
      <div className="fixed top-6 right-6 z-[60] flex flex-col gap-2">
        {error && (
          <Toast
            tone="error"
            message={error}
            onClose={() => clearToast("error")}
          />
        )}
        {success && (
          <Toast
            tone="success"
            message={success}
            onClose={() => clearToast("success")}
          />
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Emploi du temps
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isInstructor
              ? "Vos cours de la semaine."
              : "Vue hebdomadaire de l'établissement. Cliquez sur un cours pour le modifier."}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setModal({ open: true, slot: null })}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <FiPlus size={16} />
            Nouveau créneau
          </button>
        )}
      </div>

      <ScheduleFilters
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        classes={classes}
        levels={levels}
        teachers={teachers}
        classrooms={classrooms}
      />

      <ScheduleWeek
        schedules={schedules}
        loading={loading}
        onSlotClick={(slot) => {
          if (isAdmin) setModal({ open: true, slot });
        }}
      />

      <ScheduleSlotModal
        open={modal.open}
        editing={modal.slot}
        schoolYearId={selectedSchoolYearId ?? undefined}
        onClose={() => setModal({ open: false, slot: null })}
        onSave={saveSlot}
        onCancelCourse={(slot, reason) => cancelSlot(slot.scheduleId, reason)}
        onRestoreCourse={(slot) => restoreSlot(slot.scheduleId)}
        onDelete={(slot) => deleteSlot(slot.scheduleId)}
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
      <span className="max-w-md whitespace-pre-line">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="ml-3 font-bold text-gray-400 hover:text-gray-700"
      >
        <FiX size={14} />
      </button>
    </div>
  );
}
