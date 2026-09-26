"use client";

import { PortalTitle, usePortal } from "../_components/PortalProvider";

export default function PortalGradesPage() {
  const { child } = usePortal();
  if (!child) return null;

  const periods = [...new Set(child.grades.map((grade) => grade.period.label))];

  return (
    <div className="space-y-6">
      <PortalTitle
        title="Résultats"
        subtitle={`Moyennes et notes de ${child.student.firstname} ${child.student.lastname}`}
      />
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Moyennes par matière</h2>
        {child.averages.length ? (
          child.averages.map((average) => (
            <div
              className="mb-2 flex items-center justify-between rounded-lg border p-3"
              key={average.courseId}
            >
              <span>{average.course}</span>
              <div className="flex items-center gap-3">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${Math.min(100, (average.average / 20) * 100)}%`,
                    }}
                  />
                </div>
                <b>{average.average}/20</b>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Aucune moyenne calculée.</p>
        )}
        {child.generalAverage != null && (
          <div className="mt-4 flex justify-between rounded-xl border border-blue-200 bg-blue-50 p-4">
            <b>Moyenne générale</b>
            <b className="text-blue-700">{child.generalAverage}/20</b>
          </div>
        )}
      </section>

      {periods.map((period) => (
        <section key={period} className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">{period}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2">Matière</th>
                  <th className="p-2">Note</th>
                  <th className="p-2">Barème</th>
                  <th className="p-2">Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {child.grades
                  .filter((grade) => grade.period.label === period)
                  .map((grade) => (
                    <tr key={grade.gradeId} className="border-b last:border-0">
                      <td className="p-2 font-semibold">
                        {grade.assignment.course.name}
                      </td>
                      <td className="p-2 font-bold text-blue-700">
                        {grade.value}
                      </td>
                      <td className="p-2">{grade.maxScore}</td>
                      <td className="p-2 text-gray-500">
                        {grade.comment ?? "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {!child.grades.length && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-gray-500">Aucune note publiée pour le moment.</p>
        </section>
      )}
    </div>
  );
}
