"use client";

import { useCallback, useEffect, useState } from "react";
import { useSchoolYear } from "@/app/context/SchoolYearContext";
import type { DayOfWeek, Schedule } from "../_types";

export interface ScheduleFiltersState {
  classId: string;
  level: string;
  teacherId: string;
  classroomId: string;
  dayOfWeek: string;
}

const emptyFilters: ScheduleFiltersState = {
  classId: "",
  level: "",
  teacherId: "",
  classroomId: "",
  dayOfWeek: "",
};

export function useScheduleWeek() {
  const { selectedSchoolYearId } = useSchoolYear();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState<ScheduleFiltersState>(emptyFilters);
  const [reloadKey, setReloadKey] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey is an intentional refetch trigger bumped by the mutations below, not a value read inside the effect.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSchoolYearId)
          params.set("schoolYearId", String(selectedSchoolYearId));
        if (filters.classId) params.set("classId", filters.classId);
        if (filters.level) params.set("level", filters.level);
        if (filters.teacherId) params.set("teacherId", filters.teacherId);
        if (filters.classroomId) params.set("classroomId", filters.classroomId);
        if (filters.dayOfWeek) params.set("dayOfWeek", filters.dayOfWeek);
        const res = await fetch(`/api/schedule?${params.toString()}`);
        if (!res.ok)
          throw new Error("Échec du chargement de l'emploi du temps");
        const json = await res.json();
        if (!cancelled) setSchedules(json);
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedSchoolYearId, filters, reloadKey]);

  const updateFilter = (name: keyof ScheduleFiltersState, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => setFilters(emptyFilters);

  const saveSlot = async (payload: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    classroomId?: number;
    assignmentId: number;
    schoolYearId: number;
    id?: number;
  }) => {
    const res = await fetch("/api/schedule", {
      method: payload.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error ?? "Échec de l'enregistrement");
    setSuccess(
      payload.id ? "Créneau modifié avec succès" : "Créneau créé avec succès",
    );
    setReloadKey((key) => key + 1);
  };

  const cancelSlot = async (id: number, reason: string) => {
    const res = await fetch("/api/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status: "CANCELLED",
        cancellationReason: reason,
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error ?? "Échec de l'annulation");
    setSuccess("Cours annulé — les familles ont été notifiées");
    setReloadKey((key) => key + 1);
  };

  const restoreSlot = async (id: number) => {
    const res = await fetch("/api/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "SCHEDULED" }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error ?? "Échec de la restauration");
    setSuccess("Cours restauré");
    setReloadKey((key) => key + 1);
  };

  const deleteSlot = async (id: number) => {
    if (!confirm("Supprimer définitivement ce créneau ?")) return;
    const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const result = await res.json();
      setError(result.error ?? "Échec de la suppression");
      return;
    }
    setSuccess("Créneau supprimé");
    setReloadKey((key) => key + 1);
  };

  const clearToast = useCallback((kind: "error" | "success") => {
    if (kind === "error") setError(null);
    else setSuccess(null);
  }, []);

  return {
    schedules,
    loading,
    error,
    success,
    clearToast,
    filters,
    updateFilter,
    resetFilters,
    saveSlot,
    cancelSlot,
    restoreSlot,
    deleteSlot,
    refresh: () => setReloadKey((key) => key + 1),
  };
}
