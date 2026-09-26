"use client";

import { FiFilter, FiRotateCcw, FiSearch } from "react-icons/fi";
import type { StudentFiltersState } from "../_hooks/useStudentDirectory";

interface Props {
  searchInput: string;
  setSearchInput: (value: string) => void;
  filters: StudentFiltersState;
  updateFilter: (name: "classId" | "status" | "gender", value: string) => void;
  resetFilters: () => void;
  classes: Array<{ classId: number; name: string; level: string }>;
}

export function StudentFilters({
  searchInput,
  setSearchInput,
  filters,
  updateFilter,
  resetFilters,
  classes,
}: Props) {
  const hasFilters =
    searchInput || filters.classId || filters.status || filters.gender;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <FiSearch
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher un élève (nom, prénom, matricule...)"
            aria-label="Rechercher un élève"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
          />
        </div>
        <select
          aria-label="Filtrer par classe"
          value={filters.classId}
          onChange={(event) => updateFilter("classId", event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
        >
          <option value="">Toutes les classes</option>
          {classes.map((item) => (
            <option key={item.classId} value={item.classId}>
              {item.name} ({item.level})
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrer par statut"
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="INACTIVE">Inactif</option>
        </select>
        <select
          aria-label="Filtrer par genre"
          value={filters.gender}
          onChange={(event) => updateFilter("gender", event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
        >
          <option value="">Tous les genres</option>
          <option value="FEMALE">Femme</option>
          <option value="MALE">Homme</option>
        </select>
        {hasFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <FiRotateCcw size={14} />
            Réinitialiser
          </button>
        ) : (
          <span className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-400">
            <FiFilter size={14} />
            Filtres
          </span>
        )}
      </div>
    </div>
  );
}
