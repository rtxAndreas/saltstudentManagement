"use client";

import { useEffect, useMemo, useState } from "react";
import { FiX } from "react-icons/fi";
import type { DayOfWeek, Schedule } from "../_types";

const days: Array<{ value: DayOfWeek; label: string }> = [
  { value: "MONDAY", label: "Lundi" },
  { value: "TUESDAY", label: "Mardi" },
  { value: "WEDNESDAY", label: "Mercredi" },
  { value: "THURSDAY", label: "Jeudi" },
  { value: "FRIDAY", label: "Vendredi" },
  { value: "SATURDAY", label: "Samedi" },
];

interface AssignmentOption {
  assignmentId: number;
  teacher: { userId: number; name: string; lastname: string };
  class: { classId: number; name: string; level: string };
  course: { courseId: number; name: string };
  schoolYearId: number;
}

interface Props {
  open: boolean;
  editing: Schedule | null;
  schoolYearId?: number;
  onClose: () => void;
  onSave: (payload: {
    id?: number;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    classroomId?: number;
    assignmentId: number;
    schoolYearId: number;
  }) => Promise<void>;
  onCancelCourse: (slot: Schedule, reason: string) => Promise<void>;
  onRestoreCourse: (slot: Schedule) => Promise<void>;
  onDelete: (slot: Schedule) => Promise<void>;
}

export function ScheduleSlotModal({
  open,
  editing,
  schoolYearId,
  onClose,
  onSave,
  onCancelCourse,
  onRestoreCourse,
  onDelete,
}: Props) {
  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);
  const [classrooms, setClassrooms] = useState<
    Array<{ classroomId: number; name: string; capacity?: number | null }>
  >([]);
  const [classId, setClassId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("MONDAY");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/assignment").then((r) => r.json()),
      fetch("/api/classroom").then((r) => r.json()),
    ])
      .then(([a, c]) => {
        setAssignments(Array.isArray(a) ? a : []);
        setClassrooms(Array.isArray(c) ? c : []);
      })
      .catch(() => setFormError("Chargement des listes impossible."));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setFormError("");
    if (editing) {
      setClassId(String(editing.assignment?.class?.classId ?? ""));
      setAssignmentId(String(editing.assignmentId));
      setClassroomId(editing.classroomId ? String(editing.classroomId) : "");
      setDayOfWeek(editing.dayOfWeek);
      setStartTime(editing.startTime);
      setEndTime(editing.endTime);
    } else {
      setClassId("");
      setAssignmentId("");
      setClassroomId("");
      setDayOfWeek("MONDAY");
      setStartTime("08:00");
      setEndTime("09:00");
    }
  }, [open, editing]);

  // Dependent lists: only assignments of the chosen class
  const classOptions = useMemo(
    () => [
      ...new Map(assignments.map((a) => [a.class.classId, a.class])).values(),
    ],
    [assignments],
  );
  const assignmentOptions = useMemo(
    () =>
      classId
        ? assignments.filter((a) => String(a.class.classId) === classId)
        : assignments,
    [assignments, classId],
  );

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!assignmentId)
      return setFormError("Sélectionnez une matière et un enseignant.");
    if (!schoolYearId)
      return setFormError("Sélectionnez une année scolaire active.");
    setBusy(true);
    try {
      await onSave({
        ...(editing ? { id: editing.scheduleId } : {}),
        dayOfWeek,
        startTime,
        endTime,
        classroomId: classroomId ? Number(classroomId) : undefined,
        assignmentId: Number(assignmentId),
        schoolYearId,
      });
      onClose();
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : "Échec de l'enregistrement",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Modifier le créneau" : "Nouveau créneau"}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") onClose();
      }}
    >
      <div className="my-8 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {editing ? "Modifier le créneau" : "Nouveau créneau"}
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
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Classe *
            </span>
            <select
              required
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setAssignmentId("");
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-400 focus:bg-white"
            >
              <option value="">Choisir une classe</option>
              {classOptions.map((item) => (
                <option key={item.classId} value={item.classId}>
                  {item.name} ({item.level})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Matière · Enseignant *
            </span>
            <select
              required
              value={assignmentId}
              onChange={(event) => setAssignmentId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-400 focus:bg-white"
            >
              <option value="">
                {classId
                  ? "Affectations de cette classe"
                  : "Choisissez d'abord une classe"}
              </option>
              {assignmentOptions.map((item) => (
                <option key={item.assignmentId} value={item.assignmentId}>
                  {item.course.name} · {item.teacher.name}{" "}
                  {item.teacher.lastname}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Salle *
            </span>
            <select
              required
              value={classroomId}
              onChange={(event) => setClassroomId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-400 focus:bg-white"
            >
              <option value="">Choisir une salle</option>
              {classrooms.map((item) => (
                <option key={item.classroomId} value={item.classroomId}>
                  {item.name}
                  {item.capacity ? ` (cap. ${item.capacity})` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-500">
                Jour *
              </span>
              <select
                value={dayOfWeek}
                onChange={(event) =>
                  setDayOfWeek(event.target.value as DayOfWeek)
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 outline-none focus:border-blue-400 focus:bg-white"
              >
                {days.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-500">
                Début *
              </span>
              <input
                type="time"
                required
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 outline-none focus:border-blue-400 focus:bg-white"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-500">
                Fin *
              </span>
              <input
                type="time"
                required
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 outline-none focus:border-blue-400 focus:bg-white"
              />
            </label>
          </div>

          {formError && (
            <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {editing.status === "CANCELLED" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await onRestoreCourse(editing);
                        onClose();
                      } catch (cause) {
                        setFormError(
                          cause instanceof Error ? cause.message : "Échec",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="rounded-lg border border-green-300 px-3 py-2 text-sm font-semibold text-green-700"
                  >
                    Restaurer
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      const reason = window.prompt(
                        "Motif de l'annulation (les familles seront notifiées) :",
                      );
                      if (!reason || reason.trim().length < 3) return;
                      setBusy(true);
                      try {
                        await onCancelCourse(editing, reason.trim());
                        onClose();
                      } catch (cause) {
                        setFormError(
                          cause instanceof Error ? cause.message : "Échec",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="rounded-lg border border-orange-300 px-3 py-2 text-sm font-semibold text-orange-700"
                  >
                    Annuler le cours
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onDelete(editing);
                      onClose();
                    } catch (cause) {
                      setFormError(
                        cause instanceof Error ? cause.message : "Échec",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {editing ? "Enregistrer les modifications" : "Créer le créneau"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
