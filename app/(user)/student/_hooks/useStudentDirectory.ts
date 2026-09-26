"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Student } from "../_types";

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  newEnrollments: number;
}

export interface StudentFiltersState {
  classId: string;
  status: string;
  gender: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEBOUNCE_MS = 350;

export function useStudentDirectory() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    classId: "",
    status: "",
    gender: "",
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const requestRef = useRef(0);

  // Debounced search: only propagate after the user stops typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (filters.classId) params.set("classId", filters.classId);
      if (filters.status) params.set("status", filters.status);
      if (filters.gender) params.set("gender", filters.gender);
      const res = await fetch(`/api/student?${params.toString()}`);
      if (!res.ok) throw new Error("Échec du chargement des élèves");
      const json = await res.json();
      if (requestId !== requestRef.current) return;
      setStudents(json.data ?? []);
      setPagination(json.pagination);
      setStats(json.stats ?? null);
      setSelectedIds(new Set());
    } catch (err: unknown) {
      if (requestId === requestRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [page, limit, search, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (name: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setFilters({ classId: "", status: "", gender: "" });
    setPage(1);
  };

  const changeLimit = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const afterMutation = () => {
    // Keep the current page unless the last remaining row disappears.
    load();
  };

  const handleCreate = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) {
      const details = result.details
        ? ` (${Object.values(result.details).flat().join(", ")})`
        : "";
      throw new Error((result.error ?? "Échec de la création") + details);
    }
    setSuccess("Élève créé avec succès !");
    setPage(1);
    afterMutation();
  };

  const handleUpdate = async (id: number, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/student/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) {
      const details = result.details
        ? ` (${Object.values(result.details).flat().join(", ")})`
        : "";
      throw new Error((result.error ?? "Échec de la modification") + details);
    }
    setSuccess("Élève modifié avec succès !");
    afterMutation();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer définitivement cet élève ?")) return;
    const res = await fetch(`/api/student/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const result = await res.json();
      setError(result.error ?? "Échec de la suppression");
      return;
    }
    setSuccess("Élève supprimé");
    afterMutation();
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch("/api/student", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (!res.ok) {
      const result = await res.json();
      setError(result.error ?? "Échec du changement de statut");
      return;
    }
    setSuccess(newStatus === "ACTIVE" ? "Élève réactivé" : "Élève désactivé");
    afterMutation();
  };

  const handleBulkStatus = async (status: "ACTIVE" | "INACTIVE") => {
    for (const id of selectedIds) {
      await fetch("/api/student", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    }
    setSuccess(`${selectedIds.size} élève(s) mis à jour`);
    afterMutation();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) =>
      current.size === students.length && students.length > 0
        ? new Set()
        : new Set(students.map((student) => student.studentId)),
    );
  };

  return {
    students,
    pagination,
    stats,
    loading,
    error,
    success,
    setError,
    setSuccess,
    page,
    setPage,
    limit,
    changeLimit,
    searchInput,
    setSearchInput,
    filters,
    updateFilter,
    resetFilters,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleStatus,
    handleBulkStatus,
    refresh: load,
  };
}
