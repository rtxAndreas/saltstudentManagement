import { useCallback, useState } from "react";
import type { Assignment } from "../_types";

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assignment");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      setAssignments(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchAssignments();
  }, [fetchAssignments]);

  const handleCreate = async (payload: {
    teacherId: number;
    classId: number;
    courseId: number;
    schoolYearId: number;
  }) => {
    const res = await fetch("/api/assignment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to create assignment");
    setSuccess("Assignment created successfully!");
    handleRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    const res = await fetch(`/api/assignment/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to delete");
    }
    setSuccess("Assignment deleted successfully");
    handleRefresh();
  };

  return {
    assignments,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchAssignments,
    handleRefresh,
    handleCreate,
    handleDelete,
  };
}
