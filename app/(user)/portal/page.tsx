"use client";

import Link from "next/link";
import { PortalTitle, usePortal } from "./_components/PortalProvider";
import { currentDayEnum, dayLabels } from "./_types";

export default function PortalDashboardPage() {
  const { data, child } = usePortal();
  if (!data || !child) return null;

  const today = currentDayEnum();
  const todayCourses = today
    ? child.schedules.filter((slot) => slot.dayOfWeek === today)
    : [];
  const invoices = child.student.enrollments.flatMap((item) => item.invoices);
  const totalDue = invoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.totalAmount) - Number(invoice.paidAmount),
    0,
  );
  const unread = data.notifications.filter((item) => !item.readAt).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PortalTitle
          title={
            data.role === "PARENT"
              ? `Suivi de ${child.student.firstname}`
              : `Bonjour ${child.student.firstname}`
          }
          subtitle={`${child.student.class.name} · ${child.student.registrationNumber ?? "Sans matricule"}`}
        />
        <p className="text-sm text-blue-700">
          {data.role === "PARENT" ? "Espace parent" : "Espace élève"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          label="Moyenne générale"
          value={
            child.generalAverage == null ? "—" : `${child.generalAverage}/20`
          }
        />
        <Card
          label="Écolage restant"
          value={totalDue.toLocaleString("fr-FR")}
        />
        <Card label="Notifications non lues" value={String(unread)} />
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">
          Cours d’aujourd’hui{today ? ` · ${dayLabels[today]}` : ""}
        </h2>
        {todayCourses.length ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {todayCourses.map((slot) => (
              <div
                key={slot.scheduleId}
                className={`rounded-xl border p-4 ${slot.status === "CANCELLED" ? "border-red-300 bg-red-50" : ""}`}
              >
                <b>
                  {slot.startTime}–{slot.endTime}
                </b>
                <div>{slot.assignment.course.name}</div>
                <div className="text-sm text-gray-500">
                  {slot.assignment.teacher.name}{" "}
                  {slot.assignment.teacher.lastname} ·{" "}
                  {slot.classroom?.name ?? "Salle à confirmer"}
                </div>
                {slot.status === "CANCELLED" && (
                  <p className="mt-2 font-semibold text-red-700">
                    Cours annulé
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            {today ? "Aucun cours aujourd’hui." : "Pas de classe le dimanche."}
          </p>
        )}
        <Link
          href="/portal/schedule"
          className="mt-4 inline-block text-sm font-semibold text-blue-700 underline"
        >
          Voir l’emploi du temps complet
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Dernières notes</h2>
          {child.grades.slice(0, 5).map((grade) => (
            <div
              className="flex justify-between border-b p-2 text-sm last:border-0"
              key={grade.gradeId}
            >
              <span>
                {grade.assignment.course.name} · {grade.period.label}
              </span>
              <b>
                {grade.value}/{grade.maxScore}
              </b>
            </div>
          ))}
          {!child.grades.length && (
            <p className="text-gray-500">Aucune note publiée.</p>
          )}
          <Link
            href="/portal/grades"
            className="mt-4 inline-block text-sm font-semibold text-blue-700 underline"
          >
            Tous les résultats
          </Link>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Examens à venir</h2>
          {child.examRooms.slice(0, 3).map((allocation) => (
            <div
              key={allocation.allocationId}
              className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-4"
            >
              <b>{allocation.examSession.title}</b>
              <p>
                Salle {allocation.classroom.name} · Place{" "}
                {allocation.seatNumber}
              </p>
              <p className="text-sm">
                {new Date(allocation.examSession.startDate).toLocaleDateString(
                  "fr-FR",
                )}
              </p>
            </div>
          ))}
          {!child.examRooms.length && (
            <p className="text-gray-500">
              Aucune affectation d’examen publiée.
            </p>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Bulletins validés</h2>
        {child.reportCards.slice(0, 3).map((report) => (
          <Link
            href={`/reports/${report.reportCardId}`}
            key={report.reportCardId}
            className="mb-2 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4 font-semibold text-blue-700"
          >
            <span>
              {report.period.label} · {report.generalAverage}/20
            </span>
            <span className="text-sm">
              Rang {report.rank}/{report.classSize}
            </span>
          </Link>
        ))}
        {!child.reportCards.length && (
          <p className="text-gray-500">Aucun bulletin validé pour le moment.</p>
        )}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-blue-700">{value}</p>
    </div>
  );
}
