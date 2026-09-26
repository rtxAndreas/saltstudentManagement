"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/app/context/userContext";

type Detail = {
  card: {
    reportCardId: number;
    generalAverage: number;
    rank: number;
    classSize: number;
    appreciation: string | null;
    status: string;
    validatedAt: string | null;
    validatedBy: { name: string; lastname: string } | null;
    enrollment: {
      student: {
        firstname: string;
        lastname: string;
        registrationNumber: string | null;
        birthDate: string;
      };
      class: { name: string; level: string };
      schoolYear: { label: string };
    };
    period: { label: string; startDate: string; endDate: string };
  };
  row: {
    courseResults: Array<{
      courseId: number;
      course: string;
      average: number;
      gradedCount: number;
    }>;
  } | null;
  className: string;
  classAverage: number | null;
  courses: Array<{ courseId: number; course: string }>;
};

export default function ReportCardPage() {
  const { id } = useParams<{ id: string }>();
  const { userFormat } = useUser();
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(userFormat?.role ?? "");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [appreciation, setAppreciation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch(`/api/report-cards/${id}`);
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return { detail: json, appreciation: json.card.appreciation ?? "" };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((result) => {
        if (cancelled) return;
        setDetail(result.detail);
        setAppreciation(result.appreciation);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const save = async (validate: boolean) => {
    setMessage("");
    setError("");
    const response = await fetch(`/api/report-cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(userFormat?.role !== "STUDENT" && userFormat?.role !== "PARENT"
          ? { appreciation }
          : {}),
        ...(validate ? { status: "VALIDATED" } : {}),
      }),
    });
    const json = await response.json();
    if (!response.ok)
      return setError(json.error ?? "Enregistrement impossible.");
    setMessage(
      validate
        ? "Bulletin validé et familles notifiées."
        : "Appréciation enregistrée.",
    );
    await load().catch(() => undefined);
  };

  if (loading) return <div className="p-8">Chargement du bulletin…</div>;
  if (error && !detail)
    return (
      <div className="p-8">
        <div className="rounded-xl bg-red-50 p-5 text-red-800">{error}</div>
      </div>
    );
  if (!detail) return null;

  const { card, row } = detail;
  const mention =
    card.generalAverage >= 16
      ? "Félicitations"
      : card.generalAverage >= 14
        ? "Très bien"
        : card.generalAverage >= 12
          ? "Bien"
          : card.generalAverage >= 10
            ? "Passable"
            : "Insuffisant";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-3 text-gray-900 print:max-w-none print:p-0">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/reports"
          className="text-sm font-semibold text-blue-700 underline"
        >
          ← Retour aux résultats
        </Link>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => save(false)}
                className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
              >
                Enregistrer l’appréciation
              </button>
              {card.status !== "VALIDATED" && (
                <button
                  type="button"
                  onClick={() => save(true)}
                  className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800"
                >
                  Valider et notifier
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
          >
            Imprimer / PDF
          </button>
        </div>
      </div>
      {message && (
        <div className="no-print rounded-xl bg-green-50 p-3 text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="no-print rounded-xl bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <article className="space-y-6 rounded-2xl bg-white p-8 shadow-sm print:shadow-none">
        <header className="border-b pb-4 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            Bulletin de notes
          </h1>
          <p className="text-gray-600">
            {card.period.label} · Année scolaire{" "}
            {card.enrollment.schoolYear.label}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Période du{" "}
            {new Date(card.period.startDate).toLocaleDateString("fr-FR")} au{" "}
            {new Date(card.period.endDate).toLocaleDateString("fr-FR")}
          </p>
        </header>

        <section className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-gray-500">Élève</span>
            <p className="font-semibold">
              {card.enrollment.student.lastname}{" "}
              {card.enrollment.student.firstname}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Matricule</span>
            <p className="font-mono font-semibold">
              {card.enrollment.student.registrationNumber ?? "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Classe</span>
            <p className="font-semibold">
              {detail.className} · {card.enrollment.class.level}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Statut</span>
            <p
              className={`font-semibold ${card.status === "VALIDATED" ? "text-green-700" : "text-amber-700"}`}
            >
              {card.status === "VALIDATED"
                ? "Validé par l’administration"
                : "Brouillon"}
            </p>
          </div>
        </section>

        <section>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-2">Matière</th>
                <th className="p-2">Moyenne</th>
                <th className="p-2">Appréciation matière</th>
              </tr>
            </thead>
            <tbody>
              {(row?.courseResults ?? []).map((result) => (
                <tr key={result.courseId} className="border-b last:border-0">
                  <td className="p-2 font-semibold">{result.course}</td>
                  <td className="p-2">
                    {result.gradedCount ? `${result.average}/20` : "—"}
                  </td>
                  <td className="p-2 text-gray-500">
                    {result.average >= 14
                      ? "Très bien"
                      : result.average >= 12
                        ? "Bien"
                        : result.average >= 10
                          ? "Passable"
                          : "Insuffisant"}
                  </td>
                </tr>
              ))}
              {!row?.courseResults.length && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={3}>
                    Aucune note saisie pour cette période.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="text-sm text-gray-600">Moyenne générale</p>
            <p className="text-3xl font-bold text-blue-700">
              {card.generalAverage}/20
            </p>
            <p className="text-xs text-gray-500">{mention}</p>
          </div>
          <div className="rounded-xl border p-4 text-center">
            <p className="text-sm text-gray-600">Rang</p>
            <p className="text-3xl font-bold">
              {card.rank}
              <span className="text-base text-gray-500">
                {" "}
                / {card.classSize}
              </span>
            </p>
          </div>
          <div className="rounded-xl border p-4 text-center">
            <p className="text-sm text-gray-600">Moyenne de la classe</p>
            <p className="text-3xl font-bold">
              {detail.classAverage == null ? "—" : `${detail.classAverage}/20`}
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-bold">Appréciation du conseil de classe</h2>
          {isAdmin ? (
            <textarea
              className="w-full rounded-lg border p-3"
              rows={3}
              value={appreciation}
              onChange={(event) => setAppreciation(event.target.value)}
              placeholder="Appréciation générale…"
            />
          ) : (
            <p className="rounded-lg bg-gray-50 p-3 text-sm">
              {card.appreciation ?? "—"}
            </p>
          )}
        </section>

        {card.status === "VALIDATED" && (
          <footer className="border-t pt-3 text-xs text-gray-500">
            Bulletin validé
            {card.validatedBy
              ? ` par ${card.validatedBy.name} ${card.validatedBy.lastname}`
              : ""}
            {card.validatedAt
              ? ` le ${new Date(card.validatedAt).toLocaleString("fr-FR")}`
              : ""}
            .
          </footer>
        )}
      </article>
    </div>
  );
}
