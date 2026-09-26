"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Button from "@/app/components/ui/Button";
import Form from "@/app/components/ui/Form";
import Input from "@/app/components/ui/Input";
import Loading from "@/app/components/ui/Loading";
import { useUser } from "@/app/context/userContext";
import type { User } from "../_types";

interface ValidationErrors {
  name?: string[];
  email?: string[];
  role?: string[];
  oldPassword?: string[];
  newPassword?: string[];
  confirmPassword?: string[];
}

interface ApiError {
  errors?: ValidationErrors;
  message?: string;
}

interface SubmitData {
  name: string;
  email: string;
  role: string;
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const fetchUser = async (id: string): Promise<User> => {
  const response = await fetch(`/api/user/${id}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }
  return response.json();
};

const updateUserRequest = async ({
  id,
  data,
}: {
  id: string;
  data: SubmitData;
}) => {
  const response = await fetch(`/api/user/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }
  return response.json();
};

function UpdateUserPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { isAdmin, userFormat } = useUser();

  const {
    data: user,
    isLoading,
    isError,
    error: fetchError,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUser(id as string),
    enabled: !!id,
  });

  if (!id) {
    return <div className="p-6 text-center">No user ID provided.</div>;
  }

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="p-6 text-center text-red-600">
        Error loading user:{" "}
        {(fetchError as unknown as { message: string })?.message ||
          "User not found"}
      </div>
    );
  }

  if (!user) return null;

  const isSelf = userFormat?.id === Number(id);
  if (!isAdmin && !isSelf) {
    return (
      <div className="p-6 text-center text-red-600">
        You do not have permission to edit this user.
      </div>
    );
  }

  return <UpdateUserForm user={user} id={id} isAdmin={isAdmin} />;
}

export default function UpdateUserPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <UpdateUserPageContent />
    </Suspense>
  );
}

function UpdateUserForm({
  user,
  id,
  isAdmin,
}: {
  user: User;
  id: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setGlobalError(null);
  };

  const mutation = useMutation({
    mutationFn: updateUserRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      router.push("/users");
    },
    onError: (err: ApiError) => {
      if (err.errors) {
        setValidationErrors(err.errors);
      }
      setGlobalError(err.message || "Failed to update user");
    },
  });

  const handleSubmit = async () => {
    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setValidationErrors((prev) => ({
          ...prev,
          confirmPassword: ["Passwords do not match"],
        }));
        return;
      }
      if (!formData.oldPassword) {
        setValidationErrors((prev) => ({
          ...prev,
          oldPassword: ["Old password is required to change password"],
        }));
        return;
      }
    }

    const submitData: SubmitData = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    };

    if (formData.newPassword) {
      submitData.newPassword = formData.newPassword;
      submitData.oldPassword = formData.oldPassword;
    }

    mutation.mutate({ id, data: submitData });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Update User</h1>

      <Form
        onSubmit={handleSubmit}
        className="bg-white !text-gray-800 border-gray-200"
      >
        {globalError && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {globalError}
          </div>
        )}

        <Input
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={validationErrors.name?.[0]}
          required
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={validationErrors.email?.[0]}
          required
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label
            htmlFor="role-select"
            className="block text-sm font-medium text-black mb-1 ml-1"
          >
            Role
          </label>
          <select
            id="role-select"
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={!isAdmin}
            className={`w-full border text-black transition-all duration-200 bg-white px-4 py-3 text-sm font-bold rounded-xl border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-transparent ${!isAdmin ? "bg-gray-100 cursor-not-allowed opacity-75" : ""}`}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SCANNER">Scanner</option>
            <option value="SUPERVISOR">Supervisor</option>
          </select>
        </div>

        <hr className="my-6 border-gray-200" />

        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Change Password (Optional)
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Leave password fields blank if you don&apost want to change it.
        </p>

        <Input
          label="Old Password"
          name="oldPassword"
          type="password"
          value={formData.oldPassword}
          onChange={handleChange}
          error={validationErrors.oldPassword?.[0]}
        />

        <Input
          label="New Password"
          name="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          error={validationErrors.newPassword?.[0]}
        />

        <Input
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={validationErrors.confirmPassword?.[0]}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Save Changes
          </Button>
        </div>
      </Form>
    </div>
  );
}
