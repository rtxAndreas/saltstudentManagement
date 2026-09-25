"use client";

import Link from "next/link";
import { PortalTitle, usePortal } from "../_components/PortalProvider";

export default function PortalReportsPage() {
  const { child } = usePortal();
  if (!child) return null;

  return (
    <div className="space-y-6">
      <PortalTitle
        title="Bulletins"
        subtitle="Bulletins validés par l’administration"
      />
      {child.reportCards.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {child.reportCards.map((report) => (
            <Link
              href={`/reports/${report.reportCardId}`}
              key={report.reportCardId}
              className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <b>{report.period.label}</b>
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                  Validé
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold text-blue-700">
                {report.generalAverage}/20
              </p>
              <p className="text-sm text-gray-500">
                Rang {report.rank} / {report.classSize}
              </p>
              <p className="mt-3 text-sm font-semibold text-blue-700 underline">
                Voir le bulletin complet
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-gray-500">Aucun bulletin validé pour le moment.</p>
        </section>
      )}
    </div>
  );
}
