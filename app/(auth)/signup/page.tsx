"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState, useTransition } from "react";
import { FiLoader } from "react-icons/fi";

interface ValidationErrors {
  name?: string[];
  lastname?: string[];
  email?: string[];
  contact?: string[];
  password?: string[];
  confirmPassword?: string[];
}

interface ApiError {
  message: string;
  errors?: ValidationErrors;
}

const signupUser = async (data: {
  name: string;
  lastname: string;
  email: string;
  contact: string;
  password: string;
  confirmPassword: string;
}) => {
  const response = await fetch(`/api/auth/signup`, {
    method: "POST",
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

const inputStyles =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";

interface Field {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder: string;
}

const fields: Field[] = [
  {
    id: "name",
    name: "name",
    label: "First Name",
    type: "text",
    placeholder: "John",
  },
  {
    id: "lastname",
    name: "lastname",
    label: "Last Name",
    type: "text",
    placeholder: "Doe",
  },
  {
    id: "email",
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "name@example.com",
  },
  {
    id: "contact",
    name: "contact",
    label: "Contact Number",
    type: "text",
    placeholder: "+1234567890",
  },
  {
    id: "password",
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "••••••••",
  },
  {
    id: "confirmPassword",
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    placeholder: "••••••••",
  },
];

export default function Signup() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    contact: "",
    password: "",
    confirmPassword: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    if (globalError) {
      setGlobalError("");
    }
  };

  const mutation = useMutation({
    mutationFn: signupUser,
    onSuccess: () => {
      setValidationErrors({});
      setGlobalError("");
      startTransition(() => {
        router.push("/login");
      });
    },
    onError: (error: ApiError) => {
      setValidationErrors({});
      setGlobalError("");
      if (error.errors) {
        setValidationErrors(error.errors);
      } else if (error.message) {
        setGlobalError(error.message);
      } else {
        setGlobalError("An unknown error occurred");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationErrors({});
    setGlobalError("");
    mutation.mutate(formData);
  };

  return (
    <div className="graph-paper flex h-dvh items-center justify-center overflow-hidden px-3 py-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-4 text-center sm:mb-5">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Create Account
          </h1>
          <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
            Join us and start managing your school seamlessly.
          </p>
        </div>

        {globalError && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="text-sm text-red-600">{globalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2 sm:space-y-2.5">
            {fields.map((field) => {
              const error =
                validationErrors[field.name as keyof ValidationErrors]?.[0];
              return (
                <div key={field.id} className="space-y-1">
                  <label
                    htmlFor={field.id}
                    className="ml-1 text-xs font-medium text-gray-600 sm:text-sm"
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    aria-invalid={Boolean(error)}
                    className={
                      error
                        ? inputStyles +
                          " border-red-400 focus:border-red-400 focus:ring-red-100"
                        : inputStyles
                    }
                  />
                  {error && (
                    <p className="ml-1 text-xs font-medium text-red-500">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending && <FiLoader className="animate-spin" />}
            {mutation.isPending ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-gray-900 hover:underline"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
