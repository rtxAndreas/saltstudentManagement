"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FiAlertCircle, FiTrash2, FiUserCheck, FiUserX } from "react-icons/fi";
import {
  type DynamicColumn,
  DynamicTable,
  iconButton,
} from "@/app/components/ui/DynamicTable";
import Loading from "@/app/components/ui/Loading";
import { useUser } from "@/app/context/userContext";
import type { User } from "./_types";

const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch("/api/user");
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
};

const deleteUser = async (userId: number) => {
  const response = await fetch(`/api/user/${userId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete user");
  }
  return response.json();
};

const toggleStatus = async (userId: number, status: "ACTIVE" | "INACTIVE") => {
  const response = await fetch(`/api/user/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message ?? "Failed to update account status");
  }
  return response.json();
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { userFormat, isAdmin } = useUser();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      window.alert(
        error instanceof Error ? error.message : "Failed to delete user",
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: number;
      status: "ACTIVE" | "INACTIVE";
    }) => toggleStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      window.alert(
        error instanceof Error ? error.message : "Failed to update status",
      );
    },
  });

  if (isLoading && users.length === 0) {
    return <Loading skeleton />;
  }

  const visibleUsers = isAdmin
    ? users
    : users.filter((u) => u.userId === userFormat?.id);

  const columns: DynamicColumn<User>[] = [
    { key: "#", header: "#", hideable: false },
    {
      key: "user",
      header: "Utilisateur",
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold uppercase text-white">
            {`${row.name[0] ?? ""}${row.lastname?.[0] ?? ""}`}
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-slate-800">{row.name}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rôle",
      sortable: true,
      sortValue: (row) => row.role,
      render: (row) => (
        <span className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
          {row.role}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      sortable: true,
      sortValue: (row) => row.status ?? "",
      render: (row) => (
        <span
          className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${
            row.status === "ACTIVE"
              ? "border-green-100 bg-green-50 text-green-700"
              : "border-orange-100 bg-orange-50 text-orange-700"
          }`}
        >
          {row.status === "ACTIVE" ? "Actif" : "Inactif"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Créé le",
      sortable: true,
      sortValue: (row) => row.createdAt,
      render: (row) => (
        <span className="whitespace-nowrap text-slate-600">
          {new Date(row.createdAt).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      hideable: false,
      className: "text-right",
      render: (row) => {
        const isSelf = row.userId === userFormat?.id;
        if (!isAdmin && !isSelf) return null;
        return (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/users/update?id=${row.userId}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
            >
              Modifier
            </Link>
            {isAdmin && !isSelf && (
              <button
                type="button"
                title={row.status === "ACTIVE" ? "Désactiver" : "Réactiver"}
                aria-label={`${row.status === "ACTIVE" ? "Désactiver" : "Réactiver"} ${row.name}`}
                onClick={() => {
                  const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                  if (
                    window.confirm(
                      `${next === "ACTIVE" ? "Réactiver" : "Désactiver"} le compte de ${row.name} ?`,
                    )
                  ) {
                    statusMutation.mutate({ userId: row.userId, status: next });
                  }
                }}
                className={iconButton}
              >
                {row.status === "ACTIVE" ? (
                  <FiUserX size={15} />
                ) : (
                  <FiUserCheck size={15} />
                )}
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                title="Supprimer"
                aria-label={`Supprimer ${row.name}`}
                onClick={() => {
                  if (isSelf) {
                    window.alert("You cannot delete your own account here.");
                    return;
                  }
                  if (
                    window.confirm(
                      `Delete ${row.name}? This action cannot be undone.`,
                    )
                  ) {
                    deleteMutation.mutate(row.userId);
                  }
                }}
                className={`${iconButton} hover:bg-red-50 hover:text-red-600`}
              >
                <FiTrash2 size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen p-6 md:p-12 text-gray-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage platform accounts and their roles.
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/users/add"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-all"
            >
              Add User
            </Link>
          )}
        </div>

        <DynamicTable
          columns={columns}
          data={visibleUsers}
          keyExtractor={(row) => row.userId}
          isLoading={isLoading}
          countLabel="utilisateurs"
          searchText={(row) =>
            `${row.name} ${row.lastname ?? ""} ${row.email} ${row.role}`
          }
          emptyTitle="Aucun utilisateur trouvé"
          emptyMessage="Aucun compte ne correspond à votre recherche."
        />

        {(isLoading ||
          statusMutation.isPending ||
          deleteMutation.isPending) && (
          <output className="fixed top-6 right-6 z-[60] flex items-center gap-3 bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-2xl shadow-sm text-sm pointer-events-none">
            <FiAlertCircle className="animate-pulse" />
            Mise à jour…
          </output>
        )}
      </div>
    </div>
  );
}
