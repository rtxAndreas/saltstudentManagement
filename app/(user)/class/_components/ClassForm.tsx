"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiBookOpen, FiLayers, FiLoader, FiPlus, FiTag } from "react-icons/fi";
import * as z from "zod";
import { useSchoolYear } from "@/app/context/SchoolYearContext";

const schema = z.object({
  name: z.string().min(1, "Name is required (e.g., Terminale A)"),
  level: z.string().min(1, "Level is required (e.g., Terminale)"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: FormValues) => Promise<void>;
  onError: (msg: string) => void;
}

export function ClassForm({ onSubmit, onError }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const { schoolYears } = useSchoolYear();
  const activeYear = schoolYears.find((sy) => sy.status === "ACTIVE");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
      reset();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sticky top-12 bg-white border border-gray-200 p-8 rounded-2xl shadow-sm text-gray-900">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-gray-900 rounded-xl">
          <FiPlus className="text-white text-lg" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">New class</h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {activeYear && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2.5 text-xs text-blue-800">
            <FiBookOpen className="shrink-0" />
            <span>
              Adding to active school year: <strong>{activeYear.label}</strong>
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiTag className="text-gray-400" /> Name (Class Name)
          </label>
          <input
            id="name"
            {...register("name")}
            placeholder="e.g. Terminale A"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
          {errors.name && (
            <p className="text-red-500 text-xs">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="level"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiLayers className="text-gray-400" /> Level (Grade/Level)
          </label>
          <input
            id="level"
            {...register("level")}
            placeholder="e.g. Terminale"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
          {errors.level && (
            <p className="text-red-500 text-xs">{errors.level.message}</p>
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
            "Create class"
          )}
        </button>
      </form>
    </div>
  );
}
