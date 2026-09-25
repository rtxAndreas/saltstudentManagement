"use client";

import type { Schedule } from "../_types";
import { dayLabels, weekDays } from "./ScheduleFilters";

/** Pastel palette per class level (6e bleu, 5e vert, 4e orange, 3e violet…). */
const levelPalette: Array<{ match: string; className: string }> = [
  { match: "6", className: "border-blue-200 bg-blue-50 text-blue-900" },
  {
    match: "5",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  { match: "4", className: "border-orange-200 bg-orange-50 text-orange-900" },
  { match: "3", className: "border-purple-200 bg-purple-50 text-purple-900" },
];
const fallbackPalette = [
  "border-sky-200 bg-sky-50 text-sky-900",
  "border-rose-200 bg-rose-50 text-rose-900",
  "border-teal-200 bg-teal-50 text-teal-900",
  "border-amber-200 bg-amber-50 text-amber-900",
];

export function levelColor(level: string | undefined): string {
  if (level) {
    for (const entry of levelPalette) {
      if (level.includes(entry.match)) return entry.className;
    }
    let hash = 0;
    for (const char of level)
      hash = (hash + char.charCodeAt(0)) % fallbackPalette.length;
    return fallbackPalette[hash];
  }
  return "border-slate-200 bg-slate-50 text-slate-800";
}

interface Props {
  schedules: Schedule[];
  loading: boolean;
  onSlotClick: (slot: Schedule) => void;
}

export function ScheduleWeek({ schedules, loading, onSlotClick }: Props) {
  const visibleDays = weekDays.filter(
    (day) => !filtersHideEmptyDay(schedules, day),
  );
  // Unique time rows, sorted by start time
  const timeRows = [
    ...new Set(schedules.map((slot) => `${slot.startTime}-${slot.endTime}`)),
  ]
    .map((key) => {
      const [startTime, endTime] = key.split("-");
      return { key, startTime, endTime };
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (!loading && schedules.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="font-semibold text-slate-700">Aucun cours planifié</p>
        <p className="mt-1 text-sm text-slate-500">
          Ajustez les filtres ou créez un nouveau créneau.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ${loading ? "opacity-60" : ""}`}
    >
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <thead>
          <tr className="bg-slate-50">
            <th className="w-24 border-b border-slate-100 px-3 py-3 text-slate-500">
              Horaires
            </th>
            {visibleDays.map((day) => (
              <th
                key={day}
                className="border-b border-l border-slate-100 px-3 py-3 font-semibold text-slate-600"
              >
                {dayLabels[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeRows.map((row) => (
            <tr key={row.key}>
              <td className="border-b border-slate-50 px-3 py-3 align-top font-mono text-[11px] text-slate-500">
                {row.startTime}
                <br />
                {row.endTime}
              </td>
              {visibleDays.map((day) => {
                const slots = schedules.filter(
                  (slot) =>
                    slot.dayOfWeek === day &&
                    slot.startTime === row.startTime &&
                    slot.endTime === row.endTime,
                );
                return (
                  <td
                    key={day}
                    className="border-b border-l border-slate-50 p-1.5 align-top"
                  >
                    <div className="space-y-1.5">
                      {slots.map((slot) => {
                        const level = slot.assignment?.class?.level;
                        const cancelled = slot.status === "CANCELLED";
                        return (
                          <button
                            type="button"
                            key={slot.scheduleId}
                            onClick={() => onSlotClick(slot)}
                            className={`w-full rounded-lg border p-2 text-left transition-shadow hover:shadow-sm ${levelColor(level)} ${
                              cancelled ? "opacity-60 line-through" : ""
                            }`}
                          >
                            <span className="block font-bold">
                              {slot.assignment?.course?.name}
                            </span>
                            <span className="block">
                              {slot.assignment?.class?.name}
                            </span>
                            <span className="block">
                              {slot.assignment?.teacher?.name}{" "}
                              {slot.assignment?.teacher?.lastname}
                            </span>
                            <span className="block opacity-80">
                              {slot.classroom?.name ?? "Salle à définir"}
                            </span>
                            {cancelled && (
                              <span className="mt-1 inline-block rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white no-underline">
                                Annulé
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Keep Saturday only when it has courses. */
function filtersHideEmptyDay(schedules: Schedule[], day: string): boolean {
  return (
    day === "SATURDAY" && !schedules.some((slot) => slot.dayOfWeek === day)
  );
}
