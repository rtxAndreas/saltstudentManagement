"use client";

import { useMutation } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { FiLoader } from "react-icons/fi";

interface ValidationErrors {
  email?: string[];
  password?: string[];
}

interface ApiError {
  message: string;
  errors?: ValidationErrors;
}

const loginUser = async (data: { email: string; password: string }) => {
  const response = await fetch(`/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }
  return response.json();
};

const inputStyles =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
    mutationFn: loginUser,
    onSuccess: (data: { role?: string }) => {
      setValidationErrors({});
      setGlobalError("");

      const searchParams = new URLSearchParams(window.location.search);
      const roleHome =
        data.role === "STUDENT" || data.role === "PARENT"
          ? "/portal"
          : data.role === "ACCOUNTANT"
            ? "/finance"
            : "/dashboard";
      const redirectPath = searchParams.get("redirect") || roleHome;

      window.location.href = redirectPath;
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
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome Back</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your credentials to access your account.
          </p>
        </div>

        {globalError && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="text-sm text-red-600">{globalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="ml-1 text-sm font-medium text-gray-600"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={Boolean(validationErrors.email?.[0])}
                className={
                  validationErrors.email?.[0]
                    ? inputStyles +
                      " border-red-400 focus:border-red-400 focus:ring-red-100"
                    : inputStyles
                }
              />
              {validationErrors.email?.[0] && (
                <p className="ml-1 text-xs font-medium text-red-500">
                  {validationErrors.email[0]}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="ml-1 text-sm font-medium text-gray-600"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={Boolean(validationErrors.password?.[0])}
                className={
                  validationErrors.password?.[0]
                    ? inputStyles +
                      " border-red-400 focus:border-red-400 focus:ring-red-100"
                    : inputStyles
                }
              />
              {validationErrors.password?.[0] && (
                <p className="ml-1 text-xs font-medium text-red-500">
                  {validationErrors.password[0]}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending && <FiLoader className="animate-spin" />}
            {mutation.isPending ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-semibold text-gray-900 hover:underline"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
