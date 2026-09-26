"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiBookOpen,
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiEdit2,
  FiGrid,
  FiMapPin,
  FiPlus,
  FiUsers,
} from "react-icons/fi";
import {
  CancelButton,
  SelectField,
  SubmitButton,
  TextField,
} from "@/app/components/ui/FormField";
import { Modal } from "@/app/components/ui/Modal";
import { useUser } from "@/app/context/userContext";

type Year = { schoolYearId: number; label: string };
type Room = { classroomId: number; name: string; capacity: number | null };
type Exam = {
  examSessionId: number;
  title: string;
  startDate: string;
  endDate: string;
  distributionType: "BY_CLASS" | "MIXED";
  schoolYear: Year;
  _count: { allocations: number; slots: number };
};
type ExamDetail = Exam & {
  allocations: Array<{
    allocationId: number;
    seatNumber: number;
    classroom: Room;
    student: {
      studentId: number;
      registrationNumber: string | null;
      firstname: string;
      lastname: string;
      class: { name: string; level: string };
    };
  }>;
  slots: Array<{
    examSlotId: number;
    startsAt: string;
    endsAt: string;
    assignment: {
      assignmentId: number;
      course: { name: string };
      class: { name: string };
    };
    duties: Array<{
      examDutyId: number;
      classroom: Room;
      invigilator: { userId: number; name: string; lastname: string };
    }>;
  }>;
};
type Assignment = {
  assignmentId: number;
  course: { name: string };
  class: { name: string };
  teacher: { name: string; lastname: string };
};
type Staff = {
  userId: number;
  name: string;
  lastname: string;
  role: string;
  status: string;
};

type Dialog = "session" | "slot" | "duty" | null;

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Une erreur est survenue");
  return data;
}

export default function ExamsPage() {
  const { isAdmin } = useUser();
  const [exams, setExams] = useState<Exam[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [detail, setDetail] = useState<ExamDetail | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
    schoolYearId: "",
    mixed: true,
  });
  const [slotForm, setSlotForm] = useState({
    assignmentId: "",
    startsAt: "",
    endsAt: "",
  });
  const [dutyForm, setDutyForm] = useState({
    examSlotId: "",
    classroomId: "",
    invigilatorId: "",
  });

  const load = useCallback(async () => {
    try {
      const [examData, yearData, roomData, assignmentData, staffData] =
        await Promise.all([
          readJson<Exam[]>(await fetch("/api/exams")),
          readJson<Year[]>(await fetch("/api/schoolYear")),
          readJson<Room[]>(await fetch("/api/classroom")),
          readJson<Assignment[]>(await fetch("/api/assignment")),
          isAdmin
            ? readJson<Staff[]>(await fetch("/api/user"))
            : Promise.resolve([]),
        ]);
      setExams(examData);
      setYears(yearData);
      setRooms(roomData);
      setAssignments(assignmentData);
      setStaff(
        staffData.filter(
          (person) =>
            ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(person.role) &&
            person.status === "ACTIVE",
        ),
      );
      setSelectedRooms((current) =>
        current.length ? current : roomData.map((room) => room.classroomId),
      );
      setForm((current) => ({
        ...current,
        schoolYearId:
          current.schoolYearId || String(yearData[0]?.schoolYearId ?? ""),
      }));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Chargement impossible",
      );
    }
  }, [isAdmin]);

  // Reload when the resolved role changes.
  useEffect(() => {
    void load();
  }, [load]);

  const close = () => {
    setDialog(null);
    setError("");
  };

  const createExam = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await readJson(
        await fetch("/api/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            schoolYearId: Number(form.schoolYearId),
            distributionType: form.mixed ? "MIXED" : "BY_CLASS",
          }),
        }),
      );
      setMessage("Session d’examen créée.");
      setForm((current) => ({
        ...current,
        title: "",
        startDate: "",
        endDate: "",
      }));
      setDialog(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Création impossible");
    } finally {
      setSubmitting(false);
    }
  };

  const allocate = async (examSessionId: number) => {
    setError("");
    setMessage("");
    try {
      const result = await readJson<{ allocations: number }>(
        await fetch(`/api/exams/${examSessionId}/allocate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classroomIds: selectedRooms }),
        }),
      );
      setMessage(
        `${result.allocations} élève(s) placé(s); notifications préparées.`,
      );
      await load();
      await showPlan(examSessionId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Placement impossible");
    }
  };

  const showPlan = async (examSessionId: number) => {
    try {
      const value = await readJson<ExamDetail>(
        await fetch(`/api/exams/${examSessionId}`),
      );
      setDetail(value);
      setSlotForm((current) => ({
        ...current,
        assignmentId:
          current.assignmentId || String(assignments[0]?.assignmentId ?? ""),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Plan indisponible");
    }
  };

  const createSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    setError("");
    setSubmitting(true);
    try {
      await readJson(
        await fetch(`/api/exams/${detail.examSessionId}/slots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId: Number(slotForm.assignmentId),
            startsAt: new Date(slotForm.startsAt).toISOString(),
            endsAt: new Date(slotForm.endsAt).toISOString(),
          }),
        }),
      );
      setMessage("Épreuve ajoutée.");
      setDialog(null);
      await showPlan(detail.examSessionId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const assignDuty = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    setError("");
    setSubmitting(true);
    try {
      await readJson(
        await fetch(`/api/exams/${detail.examSessionId}/duties`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examSlotId: Number(dutyForm.examSlotId),
            classroomId: Number(dutyForm.classroomId),
            invigilatorId: Number(dutyForm.invigilatorId),
          }),
        }),
      );
      setMessage("Surveillant affecté.");
      setDialog(null);
      await showPlan(detail.examSessionId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const grouped =
    detail?.allocations.reduce<Record<string, ExamDetail["allocations"]>>(
      (result, allocation) => {
        const name = allocation.classroom.name;
        if (!result[name]) result[name] = [];
        result[name].push(allocation);
        return result;
      },
      {},
    ) ?? {};

  const planRooms = detail
    ? [
        ...new Map(
          detail.allocations.map((item) => [
            item.classroom.classroomId,
            item.classroom,
          ]),
        ).values(),
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 text-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Organisation des examens</h1>
          <p className="text-gray-600">
            Placement par capacité, mélange des classes et plans de salle.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setDialog("session")}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800"
          >
            <FiPlus /> Nouvelle session
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-xl bg-green-50 p-3 text-green-800">
          {message}
        </div>
      )}
      {error && !dialog && (
        <div className="rounded-xl bg-red-50 p-3 text-red-800">{error}</div>
      )}

      <Modal
        open={dialog === "session"}
        onClose={close}
        label="Nouvelle session d’examen"
        title="Nouvelle session d’examen"
        icon={
          <span className="rounded-xl bg-gray-900 p-2.5 text-white">
            <FiEdit2 />
          </span>
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={createExam} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <TextField
            id="exam-title"
            label="Titre"
            icon={<FiEdit2 />}
            required
            placeholder="Examen du 1er semestre"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              id="exam-start"
              label="Début"
              icon={<FiCalendar />}
              type="datetime-local"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <TextField
              id="exam-end"
              label="Fin"
              icon={<FiClock />}
              type="datetime-local"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          <SelectField
            id="exam-year"
            label="Année scolaire"
            icon={<FiCalendar />}
            required
            value={form.schoolYearId}
            onChange={(e) => setForm({ ...form, schoolYearId: e.target.value })}
          >
            {years.map((year) => (
              <option key={year.schoolYearId} value={year.schoolYearId}>
                {year.label}
              </option>
            ))}
          </SelectField>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <input
              type="checkbox"
              checked={form.mixed}
              onChange={(e) => setForm({ ...form, mixed: e.target.checked })}
            />
            <FiCheckSquare className="text-gray-400" /> Mélanger les élèves de
            classes différentes
          </label>

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <FiMapPin className="text-gray-400" /> Salles utilisées pour le
              placement
            </p>
            {rooms.map((room) => (
              <label
                key={room.classroomId}
                className="flex items-center justify-between rounded-xl border border-gray-200 p-3"
              >
                <span className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={selectedRooms.includes(room.classroomId)}
                    onChange={(e) =>
                      setSelectedRooms((current) =>
                        e.target.checked
                          ? [...current, room.classroomId]
                          : current.filter((id) => id !== room.classroomId),
                      )
                    }
                  />
                  {room.name}
                </span>
                <span className="text-xs text-gray-500">
                  {room.capacity ?? "capacité manquante"} places
                </span>
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <CancelButton onClick={close} />
            <SubmitButton
              loading={submitting}
              loadingLabel="Création..."
              className="flex-1"
            >
              Créer la session
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog === "slot"}
        onClose={close}
        label="Ajouter une épreuve"
        title="Ajouter une épreuve"
        icon={
          <span className="rounded-xl bg-gray-900 p-2.5 text-white">
            <FiBookOpen />
          </span>
        }
        maxWidth="max-w-xl"
      >
        <form onSubmit={createSlot} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <SelectField
            id="slot-assignment"
            label="Matière et classe"
            icon={<FiBookOpen />}
            required
            value={slotForm.assignmentId}
            onChange={(e) =>
              setSlotForm({ ...slotForm, assignmentId: e.target.value })
            }
          >
            <option value="">Matière et classe</option>
            {assignments.map((item) => (
              <option key={item.assignmentId} value={item.assignmentId}>
                {item.course.name} · {item.class.name}
              </option>
            ))}
          </SelectField>

          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              id="slot-start"
              label="Début"
              icon={<FiClock />}
              type="datetime-local"
              required
              value={slotForm.startsAt}
              onChange={(e) =>
                setSlotForm({ ...slotForm, startsAt: e.target.value })
              }
            />
            <TextField
              id="slot-end"
              label="Fin"
              icon={<FiClock />}
              type="datetime-local"
              required
              value={slotForm.endsAt}
              onChange={(e) =>
                setSlotForm({ ...slotForm, endsAt: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <CancelButton onClick={close} />
            <SubmitButton
              loading={submitting}
              loadingLabel="Ajout..."
              className="flex-1"
            >
              Ajouter l’épreuve
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog === "duty"}
        onClose={close}
        label="Affecter un surveillant"
        title="Affecter un surveillant / jury"
        icon={
          <span className="rounded-xl bg-gray-900 p-2.5 text-white">
            <FiUsers />
          </span>
        }
        maxWidth="max-w-xl"
      >
        <form onSubmit={assignDuty} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <SelectField
            id="duty-slot"
            label="Épreuve"
            icon={<FiBookOpen />}
            required
            value={dutyForm.examSlotId}
            onChange={(e) =>
              setDutyForm({ ...dutyForm, examSlotId: e.target.value })
            }
          >
            <option value="">Épreuve</option>
            {detail?.slots.map((slot) => (
              <option key={slot.examSlotId} value={slot.examSlotId}>
                {slot.assignment.course.name} ·{" "}
                {new Date(slot.startsAt).toLocaleString("fr-FR")}
              </option>
            ))}
          </SelectField>

          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              id="duty-room"
              label="Salle"
              icon={<FiMapPin />}
              required
              value={dutyForm.classroomId}
              onChange={(e) =>
                setDutyForm({ ...dutyForm, classroomId: e.target.value })
              }
            >
              <option value="">Salle</option>
              {planRooms.map((room) => (
                <option key={room.classroomId} value={room.classroomId}>
                  {room.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="duty-invigilator"
              label="Surveillant"
              icon={<FiUsers />}
              required
              value={dutyForm.invigilatorId}
              onChange={(e) =>
                setDutyForm({ ...dutyForm, invigilatorId: e.target.value })
              }
            >
              <option value="">Surveillant</option>
              {staff.map((person) => (
                <option key={person.userId} value={person.userId}>
                  {person.name} {person.lastname}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <CancelButton onClick={close} />
            <SubmitButton
              loading={submitting}
              loadingLabel="Affectation..."
              className="flex-1"
            >
              Affecter
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold">Sessions</h2>
        <div className="space-y-3">
          {exams.map((exam) => (
            <div
              key={exam.examSessionId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4"
            >
              <div>
                <b>{exam.title}</b>
                <p className="text-sm text-gray-500">
                  {exam.schoolYear.label} ·{" "}
                  {exam.distributionType === "MIXED"
                    ? "classes mélangées"
                    : "par classe"}{" "}
                  · {exam._count.allocations} placé(s)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
                  onClick={() => showPlan(exam.examSessionId)}
                >
                  Voir le plan
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    disabled={!selectedRooms.length}
                    className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => allocate(exam.examSessionId)}
                  >
                    Générer le placement
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {detail && (
        <>
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <FiGrid className="text-gray-400" /> Plan de salle —{" "}
              {detail.title}
            </h2>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              {Object.entries(grouped).map(([room, allocations]) => (
                <div
                  key={room}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <h3 className="mb-3 font-bold">Salle {room}</h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {allocations.map((allocation) => (
                      <div
                        key={allocation.allocationId}
                        className="rounded-lg border border-gray-200 bg-blue-50 p-2 text-center text-sm"
                      >
                        <b>Place {allocation.seatNumber}</b>
                        <div>
                          {allocation.student.registrationNumber ??
                            `Élève ${allocation.student.studentId}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {allocation.student.firstname}{" "}
                          {allocation.student.lastname}
                          <br />
                          {allocation.student.class.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Épreuves et surveillance</h2>
              {isAdmin && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDialog("slot")}
                    className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
                  >
                    <FiPlus /> Ajouter une épreuve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog("duty")}
                    className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800"
                  >
                    <FiUsers /> Affecter un surveillant
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {detail.slots.map((slot) => (
                <div
                  className="rounded-xl border border-gray-200 p-4"
                  key={slot.examSlotId}
                >
                  <b>
                    {slot.assignment.course.name} · {slot.assignment.class.name}
                  </b>
                  <p className="text-sm text-gray-600">
                    {new Date(slot.startsAt).toLocaleString("fr-FR")} –{" "}
                    {new Date(slot.endsAt).toLocaleTimeString("fr-FR")}
                  </p>
                  <div className="mt-2 text-sm">
                    {slot.duties.map((duty) => (
                      <span
                        className="mr-2 inline-block rounded-full bg-gray-100 px-3 py-1"
                        key={duty.examDutyId}
                      >
                        {duty.classroom.name} : {duty.invigilator.name}{" "}
                        {duty.invigilator.lastname}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
