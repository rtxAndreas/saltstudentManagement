"use client";

import { PortalTitle, usePortal } from "../_components/PortalProvider";

export default function PortalExamsPage() {
  const { child } = usePortal();
  if (!child) return null;

  return (
    <div className="space-y-6">
      <PortalTitle title="Examens" subtitle="Salles et places attribuées" />
      {child.examRooms.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {child.examRooms.map((allocation) => (
            <div
              key={allocation.allocationId}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <b>{allocation.examSession.title}</b>
              <p className="mt-1 text-sm">
                {new Date(allocation.examSession.startDate).toLocaleString(
                  "fr-FR",
                )}
              </p>
              <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 font-semibold text-blue-700">
                Salle {allocation.classroom.name} · Place{" "}
                {allocation.seatNumber}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-gray-500">Aucune affectation d’examen publiée.</p>
        </section>
      )}
    </div>
  );
}
