"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Button from "@/app/components/ui/Button";
import Loading from "@/app/components/ui/Loading";
import Table from "@/app/components/ui/Table";
import { useUser } from "@/app/context/userContext";

export interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

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
  });

  if (isLoading && users.length === 0) {
    return <Loading skeleton />;
  }

  const filteredUsers = isAdmin
    ? users
    : users.filter((u) => u.userId === userFormat?.id);

  const columns = [
    {
      header: "Name",
      accessor: (row: User) => row.name,
    },
    {
      header: "Email",
      accessor: (row: User) => row.email,
    },
    {
      header: "Role",
      accessor: (row: User) => row.role,
    },
    {
      header: "Created At",
      accessor: (row: User) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessor: (row: User) => {
        const isSelf = row.userId === userFormat?.id;
        if (!isAdmin && !isSelf) return null;

        return (
          <div className="flex gap-2">
            <Link href={`/users/update?id=${row.userId}`}>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </Link>
            {isAdmin && (
              <Button
                variant="danger"
                size="sm"
                isLoading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(row.userId)}
              >
                Delete
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        {isAdmin && (
          <Link href="/users/add">
            <Button>Add User</Button>
          </Link>
        )}
      </div>
      <Table
        columns={columns}
        data={filteredUsers}
        keyExtractor={(row) => row.userId.toString()}
        isLoading={isLoading}
        emptyMessage="No users found."
      />
    </div>
  );
}
