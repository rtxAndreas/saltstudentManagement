import { useCallback, useState } from "react";
import type { Period } from "../_types";

export function usePeriods() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/period");
      if (!res.ok) throw new Error("Failed to fetch periods");
      setPeriods(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchPeriods();
  }, [fetchPeriods]);

  const handleCreate = async (payload: {
    label: string;
    startDate: string;
    endDate: string;
    schoolYearId: number;
  }) => {
    const res = await fetch("/api/period", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        startDate: new Date(payload.startDate).toISOString(),
        endDate: new Date(payload.endDate).toISOString(),
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to create period");
    setSuccess("Period created successfully!");
    handleRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this period?")) return;
    const res = await fetch(`/api/period/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to delete");
    }
    setSuccess("Period deleted successfully");
    handleRefresh();
  };

  const handleToggleStatus = async (
    id: number,
    currentStatus: "DRAFT" | "CLOSED",
  ) => {
    const newStatus = currentStatus === "DRAFT" ? "CLOSED" : "DRAFT";
    const res = await fetch("/api/period", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to update period status");
    }
    setSuccess(`Period updated to ${newStatus}`);
    handleRefresh();
  };

  return {
    periods,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchPeriods,
    handleRefresh,
    handleCreate,
    handleDelete,
    handleToggleStatus,
  };
}
