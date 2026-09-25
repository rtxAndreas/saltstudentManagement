"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiEdit2,
  FiMapPin,
  FiPlus,
  FiUsers,
} from "react-icons/fi";
import {
  CancelButton,
  SelectField,
  SubmitButton,
  TextareaField,
  TextField,
} from "@/app/components/ui/FormField";
import { Modal } from "@/app/components/ui/Modal";
import { useUser } from "@/app/context/userContext";

type EventItem = {
  eventId: number;
  title: string;
  type: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  class: { name: string } | null;
  _count: { recipients: number };
};
type Year = { schoolYearId: number; label: string };
type ClassItem = { classId: number; name: string; level: string };

const TYPE_LABEL: Record<string, string> = {
  CONFERENCE: "Conférence",
  PARENT_MEETING: "Réunion de parents",
  SCHOOL_EVENT: "Événement scolaire",
  HOLIDAY: "Jour férié",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "CONFERENCE",
  startsAt: "",
  endsAt: "",
  location: "",
  schoolYearId: "",
  classId: "",
  requiresConfirmation: true,
};

export default function EventsPage() {
  const { isAdmin } = useUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    const [e, y, c] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/schoolYear"),
      fetch("/api/class"),
    ]);
    const values = await Promise.all([e.json(), y.json(), c.json()]);
    if (!e.ok) throw new Error(values[0].error);
    setEvents(values[0]);
    setYears(values[1]);
    setClasses(values[2]);
    setForm((current) => ({
      ...current,
      schoolYearId:
        current.schoolYearId || String(values[1][0]?.schoolYearId ?? ""),
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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          schoolYearId: Number(form.schoolYearId),
          classId: form.classId ? Number(form.classId) : null,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("Événement publié et notification envoyée.");
      setForm((current) => ({
        ...current,
        ...EMPTY_FORM,
        schoolYearId: current.schoolYearId,
      }));
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
          <h1 className="text-3xl font-bold">Conférences et événements</h1>
          <p className="text-gray-600">
            Réunions de parents, conférences et activités scolaires.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800"
          >
            <FiPlus /> Nouvel événement
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-xl bg-green-50 p-3 text-green-800">
          {message}
        </div>
      )}
      {error && !open && (
        <div className="rounded-xl bg-red-50 p-3 text-red-700">{error}</div>
      )}

      <Modal
        open={open}
        onClose={close}
        label="Nouvel événement"
        title="Nouvel événement"
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
            id="event-title"
            label="Titre"
            icon={<FiEdit2 />}
            required
            placeholder="Ex. Conférence de classe"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              id="event-type"
              label="Type"
              icon={<FiUsers />}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <TextField
              id="event-location"
              label="Lieu"
              icon={<FiMapPin />}
              placeholder="Salle 204"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <TextareaField
            id="event-description"
            label="Description"
            placeholder="Ordre du jour, participants attendus…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              id="event-start"
              label="Début"
              icon={<FiCalendar />}
              type="datetime-local"
              required
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
            <TextField
              id="event-end"
              label="Fin"
              icon={<FiClock />}
              type="datetime-local"
              required
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              id="event-year"
              label="Année scolaire"
              icon={<FiCalendar />}
              required
              value={form.schoolYearId}
              onChange={(e) =>
                setForm({ ...form, schoolYearId: e.target.value })
              }
            >
              {years.map((year) => (
                <option key={year.schoolYearId} value={year.schoolYearId}>
                  {year.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="event-class"
              label="Classe"
              icon={<FiUsers />}
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
            >
              <option value="">Toute l’école</option>
              {classes.map((item) => (
                <option key={item.classId} value={item.classId}>
                  {item.name} · {item.level}
                </option>
              ))}
            </SelectField>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <input
              type="checkbox"
              checked={form.requiresConfirmation}
              onChange={(e) =>
                setForm({ ...form, requiresConfirmation: e.target.checked })
              }
            />
            <FiCheckSquare className="text-gray-400" /> Demander une
            confirmation
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <CancelButton onClick={close} />
            <SubmitButton
              loading={submitting}
              loadingLabel="Publication..."
              className="flex-1"
            >
              Publier et notifier
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <section className="space-y-3">
        {events.map((item) => (
          <article
            className="rounded-2xl bg-white p-5 shadow-sm"
            key={item.eventId}
          >
            <div className="flex justify-between gap-3">
              <b>{item.title}</b>
              <span className="text-sm text-gray-500">
                {TYPE_LABEL[item.type] ?? item.type}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
              <FiCalendar className="text-gray-400" />
              {new Date(item.startsAt).toLocaleString("fr-FR")}
            </p>
            <p className="flex items-center gap-2 text-sm text-gray-700">
              <FiMapPin className="text-gray-400" />
              {item.location ?? "Lieu à confirmer"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {item.class?.name ?? "Toute l’école"} · {item._count.recipients}{" "}
              destinataire(s)
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
