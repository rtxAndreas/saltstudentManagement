"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FiCalendar, FiUsers } from "react-icons/fi";
import { SelectField } from "@/app/components/ui/FormField";

type ClassItem = {
  classId: number;
  name: string;
  schoolYearId: number;
  schoolYear: { label: string };
};
type Period = { periodId: number; label: string; schoolYearId: number };
type CourseResult = {
  courseId: number;
  course: string;
  average: number;
  gradedCount: number;
};
type Row = {
  enrollmentId: number;
  studentId: number;
  firstname: string;
  lastname: string;
  registrationNumber: string | null;
  courseResults: CourseResult[];
  generalAverage: number | null;
  rank: number | null;
  classSize: number;
};
type Results = {
  className: string;
  periodLabel: string;
  schoolYearLabel: string;
  courses: Array<{ courseId: number; course: string }>;
  rows: Row[];
  classAverage: number | null;
};
type CardMap = Record<
  number,
  { reportCardId: number; status: string; appreciation: string | null }
>;

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  VALIDATED: "Validé",
};

export default function ReportsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [classId, setClassId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [cards, setCards] = useState<CardMap>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/class").then((r) => r.json()),
      fetch("/api/period").then((r) => r.json()),
    ])
      .then(([c, p]) => {
        setClasses(Array.isArray(c) ? c : []);
        setPeriods(Array.isArray(p) ? p : []);
        setClassId(
          (current) =>
            current || String((Array.isArray(c) ? c : [])[0]?.classId ?? ""),
        );
      })
      .catch(() => setError("Chargement impossible."));
  }, []);

  const loadResults = useCallback(
    async (chosenClass: string, chosenPeriod: string) => {
      if (!chosenClass || !chosenPeriod) return;
      setError("");
      const response = await fetch(
        `/api/report-cards?classId=${chosenClass}&periodId=${chosenPeriod}`,
      );
      const json = await response.json();
      if (!response.ok) return setError(json.error ?? "Erreur de chargement.");
      setResults(json.results);
      setCards(json.cards ?? {});
    },
    [],
  );

  useEffect(() => {
    const chosen = classes.find((item) => item.classId === Number(classId));
    const valid = periods.filter(
      (item) => !chosen || item.schoolYearId === chosen.schoolYearId,
    );
    const nextPeriod =
      valid.find((item) => String(item.periodId) === periodId)?.periodId ??
      valid[0]?.periodId;
    setPeriodId(nextPeriod ? String(nextPeriod) : "");
  }, [classId, classes, periods, periodId]);

  useEffect(() => {
    if (classId && periodId)
      loadResults(classId, periodId).catch(() =>
        setError("Erreur de chargement."),
      );
  }, [classId, periodId, loadResults]);

  const generate = async (validate: boolean) => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/report-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: Number(classId),
          periodId: Number(periodId),
          validate,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setMessage(
        validate
          ? `Bulletins générés et validés (${json.saved}).`
          : `Bulletins générés (${json.saved}).`,
      );
      await loadResults(classId, periodId);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Erreur de génération.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-3 text-gray-900">
      <div>
        <h1 className="text-3xl font-bold">Bulletins et résultats</h1>
        <p className="text-gray-600">
          Moyennes, rangs et appréciations par classe et par période.
        </p>
      </div>
      {message && (
        <div className="rounded-xl bg-green-50 p-3 text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-red-700">{error}</div>
      )}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <div className="min-w-56">
          <SelectField
            id="report-class"
            label="Classe"
            icon={<FiUsers />}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.map((item) => (
              <option key={item.classId} value={item.classId}>
                {item.name} · {item.schoolYear.label}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="min-w-56">
          <SelectField
            id="report-period"
            label="Période"
            icon={<FiCalendar />}
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
          >
            {periods
              .filter(
                (item) =>
                  item.schoolYearId ===
                  classes.find((c) => String(c.classId) === classId)
                    ?.schoolYearId,
              )
              .map((item) => (
                <option key={item.periodId} value={item.periodId}>
                  {item.label}
                </option>
              ))}
          </SelectField>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy || !classId || !periodId}
            onClick={() => generate(false)}
            className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Générer les bulletins
          </button>
          <button
            type="button"
            disabled={busy || !classId || !periodId}
            onClick={() => generate(true)}
            className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Générer et valider
          </button>
        </div>
      </div>

      {results && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {results.className} · {results.periodLabel} ·{" "}
              {results.schoolYearLabel}
            </h2>
            <p className="text-sm text-gray-600">
              Moyenne de classe :{" "}
              <b>
                {results.classAverage == null
                  ? "—"
                  : `${results.classAverage}/20`}
              </b>
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3">Élève</th>
                  <th className="p-3">Matricule</th>
                  {results.courses.map((course) => (
                    <th key={course.courseId} className="p-3">
                      {course.course}
                    </th>
                  ))}
                  <th className="p-3">Moyenne</th>
                  <th className="p-3">Rang</th>
                  <th className="p-3">Bulletin</th>
                </tr>
              </thead>
              <tbody>
                {results.rows.map((row) => {
                  const card = cards[row.enrollmentId];
                  return (
                    <tr
                      key={row.enrollmentId}
                      className="border-b last:border-0"
                    >
                      <td className="p-3 font-semibold">
                        {row.lastname} {row.firstname}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {row.registrationNumber ?? "—"}
                      </td>
                      {results.courses.map((course) => {
                        const cell = row.courseResults.find(
                          (item) => item.courseId === course.courseId,
                        );
                        return (
                          <td key={course.courseId} className="p-3">
                            {cell?.gradedCount ? (
                              `${cell.average}/20`
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 font-bold text-blue-700">
                        {row.generalAverage == null
                          ? "—"
                          : `${row.generalAverage}/20`}
                      </td>
                      <td className="p-3">
                        {row.rank ? `${row.rank} / ${row.classSize}` : "—"}
                      </td>
                      <td className="p-3">
                        {card ? (
                          <Link
                            href={`/reports/${card.reportCardId}`}
                            className="font-semibold text-blue-700 underline"
                          >
                            {statusLabels[card.status] ?? card.status}
                          </Link>
                        ) : (
                          <span className="text-gray-400">Non généré</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {results.rows.length === 0 && (
                  <tr>
                    <td
                      className="p-4 text-gray-500"
                      colSpan={4 + results.courses.length}
                    >
                      Aucun élève inscrit dans cette classe pour cette période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
