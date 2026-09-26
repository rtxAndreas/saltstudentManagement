import { useCallback, useState } from "react";
import { useSchoolYear } from "@/app/context/SchoolYearContext";
import type { SchoolYear } from "../_types";

export function useSchoolYears() {
  const { refreshSchoolYears } = useSchoolYear();
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSchoolYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/schoolYear");
      if (!res.ok) throw new Error("Failed to fetch school years");
      setSchoolYears(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchSchoolYears();
    await refreshSchoolYears();
  }, [fetchSchoolYears, refreshSchoolYears]);

  const handleCreate = async (payload: {
    label: string;
    startDate: string;
    endDate: string;
  }) => {
    const res = await fetch("/api/schoolYear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        startDate: new Date(payload.startDate).toISOString(),
        endDate: new Date(payload.endDate).toISOString(),
      }),
    });
    const result = await res.json();
    if (!res.ok)
      throw new Error(result.error || "Failed to create school year");
    setSuccess("School year created successfully!");
    handleRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this school year?")) return;
    const res = await fetch(`/api/schoolYear/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to delete");
    }
    setSuccess("School year deleted successfully");
    handleRefresh();
  };

  const handleActivate = async (id: number) => {
    const res = await fetch("/api/schoolYear", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "ACTIVE" }),
    });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to activate");
    }
    setSuccess("School year activated successfully");
    handleRefresh();
  };

  return {
    schoolYears,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchSchoolYears,
    handleRefresh,
    handleCreate,
    handleDelete,
    handleActivate,
  };
}
