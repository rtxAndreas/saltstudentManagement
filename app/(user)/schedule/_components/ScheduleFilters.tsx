"use client";

import { FiRotateCcw } from "react-icons/fi";
import type { ScheduleFiltersState } from "../_hooks/useScheduleWeek";
import type { DayOfWeek } from "../_types";

const days: Array<{ value: DayOfWeek; label: string }> = [
  { value: "MONDAY", label: "Lundi" },
  { value: "TUESDAY", label: "Mardi" },
  { value: "WEDNESDAY", label: "Mercredi" },
  { value: "THURSDAY", label: "Jeudi" },
  { value: "FRIDAY", label: "Vendredi" },
  { value: "SATURDAY", label: "Samedi" },
];

interface Props {
  filters: ScheduleFiltersState;
  updateFilter: (name: keyof ScheduleFiltersState, value: string) => void;
  resetFilters: () => void;
  classes: Array<{ classId: number; name: string; level: string }>;
  levels: string[];
  teachers: Array<{ userId: number; name: string; lastname: string }>;
  classrooms: Array<{ classroomId: number; name: string }>;
}

const selectClass =
  "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white";

export function ScheduleFilters({
  filters,
  updateFilter,
  resetFilters,
  classes,
  levels,
  teachers,
  classrooms,
}: Props) {
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <select
        aria-label="Filtrer par niveau"
        value={filters.level}
        onChange={(e) => updateFilter("level", e.target.value)}
        className={selectClass}
      >
        <option value="">Tous les niveaux</option>
        {levels.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
      <select
        aria-label="Filtrer par classe"
        value={filters.classId}
        onChange={(e) => updateFilter("classId", e.target.value)}
        className={selectClass}
      >
        <option value="">Toutes les classes</option>
        {classes.map((item) => (
          <option key={item.classId} value={item.classId}>
            {item.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Filtrer par enseignant"
        value={filters.teacherId}
        onChange={(e) => updateFilter("teacherId", e.target.value)}
        className={selectClass}
      >
        <option value="">Tous les enseignants</option>
        {teachers.map((item) => (
          <option key={item.userId} value={item.userId}>
            {item.name} {item.lastname}
          </option>
        ))}
      </select>
      <select
        aria-label="Filtrer par salle"
        value={filters.classroomId}
        onChange={(e) => updateFilter("classroomId", e.target.value)}
        className={selectClass}
      >
        <option value="">Toutes les salles</option>
        {classrooms.map((item) => (
          <option key={item.classroomId} value={item.classroomId}>
            {item.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Filtrer par jour"
        value={filters.dayOfWeek}
        onChange={(e) => updateFilter("dayOfWeek", e.target.value)}
        className={selectClass}
      >
        <option value="">Toute la semaine</option>
        {days.map((day) => (
          <option key={day.value} value={day.value}>
            {day.label}
          </option>
        ))}
      </select>
      {hasFilters ? (
        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <FiRotateCcw size={14} />
          Réinitialiser
        </button>
      ) : (
        <span className="px-2 text-sm text-slate-400">Filtres combinables</span>
      )}
    </div>
  );
}

export const dayLabels: Record<DayOfWeek, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
};

export const weekDays: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
