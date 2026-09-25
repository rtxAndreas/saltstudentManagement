"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCheckSquare,
  FiClipboard,
  FiClock,
  FiUsers,
} from "react-icons/fi";
import {
  CancelButton,
  SelectField,
  SubmitButton,
} from "@/app/components/ui/FormField";
import { Modal } from "@/app/components/ui/Modal";

type Schedule = {
  scheduleId: number;
  dayOfWeek: string;
  startTime: string;
  assignment: {
    teacher: { userId: number; name: string; lastname: string };
    class: { classId: number; name: string };
    course: { name: string };
  };
};
type Student = {
  studentId: number;
  firstname: string;
  lastname: string;
  classId: number;
};

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Présent" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "En retard" },
  { value: "EXCUSED", label: "Excusé" },
];

const STATUS_STYLE: Record<string, string> = {
  PRESENT: "bg-green-50 text-green-700 border-green-200",
  ABSENT: "bg-red-50 text-red-700 border-red-200",
  LATE: "bg-amber-50 text-amber-700 border-amber-200",
  EXCUSED: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function AttendancePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scheduleId, setScheduleId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/schedule").then((r) => r.json()),
      fetch("/api/student").then((r) => r.json()),
    ]).then(([s, st]) => {
      setSchedules(s);
      setStudents(st);
      setScheduleId(String(s[0]?.scheduleId ?? ""));
    });
  }, []);

  const selected = schedules.find(
    (item) => item.scheduleId === Number(scheduleId),
  );
  const classStudents = useMemo(
    () =>
      students.filter(
        (item) => item.classId === selected?.assignment.class.classId,
      ),
    [students, selected],
  );

  const close = () => {
    setOpen(false);
    setError("");
  };

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      const results = await Promise.all(
        classStudents.map((student) =>
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: student.studentId,
              scheduleId: Number(scheduleId),
              date: new Date(`${date}T00:00:00.000Z`).toISOString(),
              status: statuses[student.studentId] ?? "PRESENT",
            }),
          }),
        ),
      );
      if (!results.every((result) => result.ok)) {
        setError("Certaines présences n’ont pas été enregistrées.");
        return;
      }
      setMessage("Présences enregistrées.");
      setOpen(false);
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-3 text-gray-900">
      <div>
        <h1 className="text-3xl font-bold">Présences</h1>
        <p className="text-gray-600">
          Appel par cours et notification visible dans l’espace familial.
        </p>
      </div>

      {message && <div className="rounded-xl bg-green-50 p-3">{message}</div>}
      {error && !open && (
        <div className="rounded-xl bg-red-50 p-3 text-red-700">{error}</div>
      )}

      <div className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-2">
        <SelectField
          id="attendance-schedule"
          label="Cours"
          icon={<FiClipboard />}
          value={scheduleId}
          onChange={(e) => setScheduleId(e.target.value)}
        >
          {schedules.map((slot) => (
            <option key={slot.scheduleId} value={slot.scheduleId}>
              {slot.assignment.course.name} · {slot.assignment.class.name} ·{" "}
              {slot.dayOfWeek} {slot.startTime}
            </option>
          ))}
        </SelectField>
        <div className="flex items-end">
          <div className="w-full">
            <label
              htmlFor="attendance-date"
              className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-600"
            >
              <FiCalendar className="text-gray-400" /> Date
            </label>
            <input
              id="attendance-date"
              type="date"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={close}
        label="Prendre l’appel"
        title="Prendre l’appel"
        icon={
          <span className="rounded-xl bg-gray-900 p-2.5 text-white">
            <FiClipboard />
          </span>
        }
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
            <FiUsers className="text-gray-400" />
            <b className="text-gray-900">{selected?.assignment.course.name}</b>
            <span>·</span>
            <span>{selected?.assignment.class.name}</span>
            <span>·</span>
            <FiClock className="text-gray-400" />
            <span>
              {new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR")}
            </span>
          </div>

          <div className="space-y-2">
            {classStudents.map((student) => {
              const status = statuses[student.studentId] ?? "PRESENT";
              return (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3"
                  key={student.studentId}
                >
                  <span className="text-sm font-medium text-gray-800">
                    {student.firstname} {student.lastname}
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
                    >
                      {
                        STATUS_OPTIONS.find((item) => item.value === status)
                          ?.label
                      }
                    </span>
                    <select
                      aria-label={`Statut de ${student.firstname} ${student.lastname}`}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
                      value={status}
                      onChange={(e) =>
                        setStatuses({
                          ...statuses,
                          [student.studentId]: e.target.value,
                        })
                      }
                    >
                      {STATUS_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </span>
                </div>
              );
            })}
            {classStudents.length === 0 && (
              <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
                Aucun élève pour ce cours.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <CancelButton onClick={close} />
            <SubmitButton
              type="button"
              onClick={save}
              loading={saving}
              loadingLabel="Enregistrement..."
              className="flex-1"
              disabled={!classStudents.length}
            >
              <FiCheckSquare /> Enregistrer l’appel
            </SubmitButton>
          </div>
        </div>
      </Modal>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              {selected?.assignment.class.name ?? "Classe"}
            </h2>
            <p className="text-sm text-gray-500">
              {classStudents.length} élève(s) ·{" "}
              {new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!classStudents.length}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiClipboard /> Faire l’appel
          </button>
        </div>
        <div className="space-y-2">
          {classStudents.map((student) => {
            const status = statuses[student.studentId] ?? "PRESENT";
            return (
              <div
                className="flex items-center justify-between rounded-xl border border-gray-200 p-3"
                key={student.studentId}
              >
                <span className="text-sm font-medium text-gray-800">
                  {student.firstname} {student.lastname}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
                >
                  {STATUS_OPTIONS.find((item) => item.value === status)?.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
