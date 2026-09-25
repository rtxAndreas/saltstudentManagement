"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiAward,
  FiBookOpen,
  FiCalendar,
  FiCheckSquare,
  FiEdit2,
  FiHash,
  FiPlus,
  FiTrendingUp,
} from "react-icons/fi";
import {
  CancelButton,
  SelectField,
  SubmitButton,
  TextField,
} from "@/app/components/ui/FormField";
import { Modal } from "@/app/components/ui/Modal";

type Assignment = {
  assignmentId: number;
  course: { name: string };
  class: { name: string };
  schoolYearId: number;
};
type Period = { periodId: number; label: string; schoolYearId: number };
type Assessment = {
  assessmentId: number;
  title: string;
  type: string;
  maxScore: number;
  coefficient: number;
  scheduledAt: string | null;
  publishedAt: string | null;
  period: Period;
  assignment: Assignment;
  _count: { grades: number };
};

const TYPE_LABEL: Record<string, string> = {
  QUIZ: "Interrogation",
  HOMEWORK: "Devoir",
  PROJECT: "Projet",
  EXAM: "Examen",
  RESIT: "Rattrapage",
};

const EMPTY_FORM = {
  title: "",
  type: "EXAM",
  maxScore: "20",
  coefficient: "1",
  scheduledAt: "",
  assignmentId: "",
  periodId: "",
  publish: true,
};

export default function AssessmentsPage() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    const responses = await Promise.all([
      fetch("/api/assessments"),
      fetch("/api/assignment"),
      fetch("/api/period"),
    ]);
    const [a, as, p] = await Promise.all(responses.map((r) => r.json()));
    if (!responses[0].ok) throw new Error(a.error);
    setItems(a);
    setAssignments(as);
    setPeriods(p);
    setForm((current) => ({
      ...current,
      assignmentId: current.assignmentId || String(as[0]?.assignmentId ?? ""),
      periodId:
        current.periodId ||
        String(
          p.find((x: Period) => x.schoolYearId === as[0]?.schoolYearId)
            ?.periodId ?? "",
        ),
    }));
  }, []);

  // Initial data loading synchronizes the page with the API once on mount.
  useEffect(() => {
    load().catch((cause) => setError(cause.message));
  }, [load]);

  const close = () => {
    setOpen(false);
    setError("");
  };

  const chosen = assignments.find(
    (item) => item.assignmentId === Number(form.assignmentId),
  );
  const validPeriods = periods.filter(
    (item) => !chosen || item.schoolYearId === chosen.schoolYearId,
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          assignmentId: Number(form.assignmentId),
          periodId: Number(form.periodId),
          maxScore: Number(form.maxScore),
          coefficient: Number(form.coefficient),
          scheduledAt: form.scheduledAt
            ? new Date(form.scheduledAt).toISOString()
            : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("Évaluation créée.");
      setForm((current) => ({ ...current, title: "", scheduledAt: "" }));
      setOpen(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Création impossible");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 text-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Évaluations</h1>
          <p className="text-gray-600">
            Devoirs, examens, projets et barèmes publiés aux familles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800"
        >
          <FiPlus /> Nouvelle évaluation
        </button>
      </div>

      {message && <div className="rounded-xl bg-green-50 p-3">{message}</div>}
      {error && !open && (
        <div className="rounded-xl bg-red-50 p-3 text-red-700">{error}</div>
      )}

      <Modal
        open={open}
        onClose={close}
        label="Nouvelle évaluation"
        title="Nouvelle évaluation"
        icon={
          <span className="rounded-xl bg-gray-900 p-2.5 text-white">
            <FiEdit2 />
          </span>
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={submit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <TextField
            id="assessment-title"
            label="Titre"
            icon={<FiEdit2 />}
            required
            placeholder="Ex. Devoir surveillé n°2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              id="assessment-type"
              label="Type"
              icon={<FiBookOpen />}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="assessment-assignment"
              label="Matière et classe"
              icon={<FiBookOpen />}
              required
              value={form.assignmentId}
              onChange={(e) =>
                setForm({ ...form, assignmentId: e.target.value, periodId: "" })
              }
            >
              {assignments.map((item) => (
                <option key={item.assignmentId} value={item.assignmentId}>
                  {item.course.name} · {item.class.name}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              id="assessment-period"
              label="Période"
              icon={<FiCalendar />}
              required
              value={form.periodId}
              onChange={(e) => setForm({ ...form, periodId: e.target.value })}
            >
              <option value="">Période</option>
              {validPeriods.map((item) => (
                <option key={item.periodId} value={item.periodId}>
                  {item.label}
                </option>
              ))}
            </SelectField>
            <TextField
              id="assessment-date"
              label="Date planifiée"
              icon={<FiCalendar />}
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) =>
                setForm({ ...form, scheduledAt: e.target.value })
              }
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              id="assessment-maxscore"
              label="Barème"
              icon={<FiAward />}
              type="number"
              min="1"
              step="0.5"
              required
              value={form.maxScore}
              onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
            />
            <TextField
              id="assessment-coefficient"
              label="Coefficient"
              icon={<FiTrendingUp />}
              type="number"
              min="0.1"
              step="0.1"
              required
              value={form.coefficient}
              onChange={(e) =>
                setForm({ ...form, coefficient: e.target.value })
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <input
              type="checkbox"
              checked={form.publish}
              onChange={(e) => setForm({ ...form, publish: e.target.checked })}
            />
            <FiCheckSquare className="text-gray-400" /> Publier aux familles
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <CancelButton onClick={close} />
            <SubmitButton
              loading={submitting}
              loadingLabel="Création..."
              className="flex-1"
            >
              Créer l’évaluation
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <section className="space-y-3">
        {items.map((item) => (
          <article
            className="rounded-2xl bg-white p-5 shadow-sm"
            key={item.assessmentId}
          >
            <div className="flex flex-wrap justify-between gap-2">
              <b>
                {item.title} · {item.assignment.course.name}
              </b>
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <FiAward className="text-gray-400" /> {item.maxScore} pts ·
                coef. {item.coefficient}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
              <FiHash className="text-gray-400" />
              {item.assignment.class.name} · {item.period.label} ·{" "}
              {item._count.grades} note(s)
            </p>
            <p className="text-sm text-gray-500">
              {item.publishedAt ? "Publié aux familles" : "Brouillon"}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
