import { useCallback, useState } from "react";
import type { Grade } from "../_types";

export function useGrades(assignmentId?: number) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    try {
      const url = assignmentId
        ? `/api/grade?assignmentId=${assignmentId}`
        : "/api/grade";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch grades");
      setGrades(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  const handleRefresh = useCallback(async () => {
    await fetchGrades();
  }, [fetchGrades]);

  const handleCreate = async (payload: {
    value: number;
    maxScore?: number;
    comment?: string;
    studentId: number;
    periodId: number;
    assignmentId: number;
    assessmentId?: number;
  }) => {
    const res = await fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to create grade");
    setSuccess("Grade created successfully!");
    handleRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this grade?")) return;
    const res = await fetch(`/api/grade/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to delete");
    }
    setSuccess("Grade deleted successfully");
    handleRefresh();
  };

  const handleUpdateValue = async (id: number, value: number) => {
    const res = await fetch("/api/grade", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, value }),
    });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to update grade");
    }
    setSuccess("Grade updated successfully");
    handleRefresh();
  };

  return {
    grades,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchGrades,
    handleRefresh,
    handleCreate,
    handleDelete,
    handleUpdateValue,
  };
}
