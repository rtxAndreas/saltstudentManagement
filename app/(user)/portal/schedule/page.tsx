"use client";

import { PortalTitle, usePortal } from "../_components/PortalProvider";
import { dayLabels, dayOrder } from "../_types";

export default function PortalSchedulePage() {
  const { child } = usePortal();
  if (!child) return null;

  return (
    <div className="space-y-6">
      <PortalTitle
        title="Emploi du temps"
        subtitle={`Classe ${child.student.class.name} · semaine complète`}
      />
      {dayOrder.map((day) => {
        const slots = child.schedules
          .filter((slot) => slot.dayOfWeek === day)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        if (!slots.length) return null;
        return (
          <section key={day} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">{dayLabels[day]}</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {slots.map((slot) => (
                <div
                  key={slot.scheduleId}
                  className={`rounded-xl border p-4 ${
                    slot.status === "CANCELLED"
                      ? "border-red-300 bg-red-50"
                      : slot.status === "RESCHEDULED"
                        ? "border-amber-300 bg-amber-50"
                        : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <b>
                      {slot.startTime}–{slot.endTime}
                    </b>
                    {slot.status === "CANCELLED" && (
                      <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                        Annulé
                      </span>
                    )}
                    {slot.status === "RESCHEDULED" && (
                      <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                        Déplacé
                      </span>
                    )}
                  </div>
                  <div className="font-semibold">
                    {slot.assignment.course.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {slot.assignment.teacher.name}{" "}
                    {slot.assignment.teacher.lastname}
                  </div>
                  <div className="text-sm text-gray-500">
                    {slot.classroom?.name ?? "Salle à confirmer"}
                  </div>
                  {slot.status === "CANCELLED" && slot.cancellationReason && (
                    <p className="mt-2 text-sm font-semibold text-red-700">
                      Motif : {slot.cancellationReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {!child.schedules.length && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-gray-500">
            Aucun cours planifié pour cette classe.
          </p>
        </section>
      )}
    </div>
  );
}
