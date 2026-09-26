"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiHash,
  FiLoader,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";
import * as z from "zod";

const schema = z.object({
  name: z.string().min(1, "First name is required"),
  lastname: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  role: z.string().min(1, "Role is required"),
  registrationNumber: z.string().optional(),
  studentId: z.string().optional(),
  childStudentIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ValidationErrors {
  name?: string[];
  email?: string[];
  password?: string[];
  role?: string[];
}

interface ApiError {
  errors?: ValidationErrors;
  message?: string;
}

const createUserRequest = async (data: FormValues) => {
  const response = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      studentId: data.studentId ? Number(data.studentId) : undefined,
      childStudentIds: data.childStudentIds?.map(Number),
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }
  return response.json();
};

export default function CreateUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<
    Array<{
      studentId: number;
      firstname: string;
      lastname: string;
      registrationNumber: string | null;
      userId?: number | null;
    }>
  >([]);

  const [formData, setFormData] = useState<FormValues>({
    name: "",
    lastname: "",
    contact: "",
    email: "",
    password: "",
    role: "INSTRUCTOR",
    registrationNumber: "",
    studentId: "",
    childStudentIds: [],
  });

  useEffect(() => {
    fetch("/api/student")
      .then((response) => (response.ok ? response.json() : []))
      .then(setStudents)
      .catch(() => setStudents([]));
  }, []);

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
    mutationFn: createUserRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSuccess("User created successfully");
      setTimeout(() => router.push("/users"), 1200);
    },
    onError: (err: ApiError) => {
      if (err.errors) {
        setValidationErrors(err.errors);
      }
      setGlobalError(err.message || "Failed to create user");
    },
  });

  const handleSubmit = async () => {
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: ValidationErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ValidationErrors;
        if (key) fieldErrors[key] = [issue.message];
      }
      setValidationErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await mutation.mutateAsync(result.data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 text-gray-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Create user
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Add a new instructor or admin account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            Back
          </button>
        </div>

        {/* Toasts */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {globalError && (
            <div className="pointer-events-auto flex items-center gap-3 bg-white border border-red-100 text-red-600 px-4 py-3 rounded-2xl shadow-sm text-sm">
              <FiAlertCircle className="shrink-0" />
              <span>{globalError}</span>
              <button
                type="button"
                onClick={() => setGlobalError(null)}
                className="ml-3 text-gray-400 hover:text-gray-700 font-bold"
              >
                x
              </button>
            </div>
          )}
          {success && (
            <div className="pointer-events-auto flex items-center gap-3 bg-white border border-green-100 text-green-700 px-4 py-3 rounded-2xl shadow-sm text-sm">
              <FiCheckCircle className="shrink-0" />
              <span>{success}</span>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="ml-3 text-gray-400 hover:text-gray-700 font-bold"
              >
                x
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="sticky top-12 bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-gray-900 rounded-xl">
                <FiUserPlus className="text-white text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">New user</h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-600 flex items-center gap-2"
                >
                  <FiUser className="text-gray-400" /> First Name / Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
                  required
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.name[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="lastname"
                  className="text-sm font-medium text-gray-600 flex items-center gap-2"
                >
                  <FiUser className="text-gray-400" /> Lastname
                </label>
                <input
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="contact"
                  className="text-sm font-medium text-gray-600 flex items-center gap-2"
                >
                  <FiPhone className="text-gray-400" /> Contact
                </label>
                <input
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-600 flex items-center gap-2"
                >
                  <FiMail className="text-gray-400" /> Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
                  required
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.email[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="role"
                  className="text-sm font-medium text-gray-600 flex items-center gap-2"
                >
                  <FiShield className="text-gray-400" /> Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
                >
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="ADMIN">Admin</option>
                  <option value="ACCOUNTANT">Comptable</option>
                  <option value="STUDENT">Élève</option>
                  <option value="PARENT">Parent</option>
                </select>
                {validationErrors.role && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.role[0]}
                  </p>
                )}
              </div>

              {formData.role === "STUDENT" && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="studentId"
                    className="text-sm font-medium text-gray-600"
                  >
                    Dossier élève associé
                  </label>
                  <select
                    id="studentId"
                    name="studentId"
                    required
                    value={formData.studentId}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                  >
                    <option value="">Sélectionner l’élève</option>
                    {students
                      .filter((student) => !student.userId)
                      .map((student) => (
                        <option
                          key={student.studentId}
                          value={student.studentId}
                        >
                          {student.firstname} {student.lastname} ·{" "}
                          {student.registrationNumber ?? "sans matricule"}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {formData.role === "PARENT" && (
                <fieldset className="space-y-2 rounded-xl border border-gray-200 p-3">
                  <legend className="px-1 text-sm font-medium text-gray-600">
                    Enfant(s) associé(s)
                  </legend>
                  {students.map((student) => (
                    <label
                      key={student.studentId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={
                          formData.childStudentIds?.includes(
                            String(student.studentId),
                          ) ?? false
                        }
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            childStudentIds: event.target.checked
                              ? [
                                  ...(current.childStudentIds ?? []),
                                  String(student.studentId),
                                ]
                              : (current.childStudentIds ?? []).filter(
                                  (id) => id !== String(student.studentId),
                                ),
                          }))
                        }
                      />
                      {student.firstname} {student.lastname} ·{" "}
                      {student.registrationNumber ?? "sans matricule"}
                    </label>
                  ))}
                </fieldset>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="registrationNumber"
                  className="text-sm font-medium text-gray-600 flex items-center gap-2"
                >
                  <FiHash className="text-gray-400" /> Registration Number
                  (Teacher ID)
                </label>
                <input
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="e.g. TCH-001"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-600 flex items-center gap-2"
                >
                  <FiLock className="text-gray-400" /> Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
                  required
                />
                {validationErrors.password && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.password[0]}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <FiLoader className="animate-spin" /> Creating...
                  </>
                ) : (
                  "Create user"
                )}
              </button>
            </form>
          </div>

          <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              User details
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Fill in the form to create a new user account. Instructors can
              manage grades, assignments, and students. Admins have full access
              to all features including user management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
