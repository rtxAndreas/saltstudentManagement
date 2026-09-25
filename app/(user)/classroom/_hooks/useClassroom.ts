import { useCallback, useState } from "react";
import type { Classroom } from "../_types";

export function useClassrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/classroom");
      if (!res.ok) throw new Error("Failed to fetch classrooms");
      setClassrooms(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchClassrooms();
  }, [fetchClassrooms]);

  const handleCreate = async (payload: {
    name: string;
    capacity?: number;
    building?: string;
  }) => {
    const res = await fetch("/api/classroom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to create classroom");
    setSuccess("Classroom created successfully!");
    handleRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this classroom?")) return;
    const res = await fetch(`/api/classroom/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to delete");
    }
    setSuccess("Classroom deleted successfully");
    handleRefresh();
  };

  return {
    classrooms,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchClassrooms,
    handleRefresh,
    handleCreate,
    handleDelete,
  };
}
