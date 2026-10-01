import { useCallback, useState } from "react";
import type { Class } from "../_types";

export function useClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/class");
      if (!res.ok) throw new Error("Failed to fetch classes");
      setClasses(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchClasses();
  }, [fetchClasses]);

  const handleCreate = async (payload: { name: string; level: string }) => {
    const res = await fetch("/api/class", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to create class");
    setSuccess("Class created successfully!");
    handleRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    const res = await fetch(`/api/class/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to delete");
    }
    setSuccess("Class deleted successfully");
    handleRefresh();
  };

  const handleToggleStatus = async (
    id: number,
    currentStatus: "ACTIVE" | "INACTIVE",
  ) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch("/api/class", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to update class status");
    }
    setSuccess(`Class updated to ${newStatus}`);
    handleRefresh();
  };

  return {
    classes,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchClasses,
    handleRefresh,
    handleCreate,
    handleDelete,
    handleToggleStatus,
  };
}
