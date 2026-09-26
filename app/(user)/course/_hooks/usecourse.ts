import { useCallback, useState } from "react";
import type { Course } from "../_types";

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/course");
      if (!res.ok) throw new Error("Failed to fetch courses");
      setCourses(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchCourses();
  }, [fetchCourses]);

  const handleCreate = async (payload: {
    name: string;
    code: string;
    coefficient: number;
    classIds: number[];
  }) => {
    const res = await fetch("/api/course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to create course");
    setSuccess("Course created successfully!");
    handleRefresh();
  };

  const handleUpdate = async (
    id: number,
    payload: {
      name: string;
      code: string;
      coefficient: number;
      classIds: number[];
    },
  ) => {
    const res = await fetch(`/api/course/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to update course");
    setSuccess("Course updated successfully!");
    handleRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    const res = await fetch(`/api/course/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to delete");
    }
    setSuccess("Course deleted successfully");
    handleRefresh();
  };

  const handleToggleStatus = async (
    id: number,
    currentStatus: "ACTIVE" | "INACTIVE",
  ) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch("/api/course", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, statusCourse: newStatus }),
    });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to update course status");
    }
    setSuccess(`Course status updated to ${newStatus}`);
    handleRefresh();
  };

  return {
    courses,
    loading,
    error,
    success,
    setError,
    setSuccess,
    fetchCourses,
    handleRefresh,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleStatus,
  };
}
