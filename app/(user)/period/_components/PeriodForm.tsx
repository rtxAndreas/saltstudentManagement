"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiBookOpen,
  FiCalendar,
  FiLoader,
  FiPlus,
  FiTag,
} from "react-icons/fi";
import * as z from "zod";
import { useSchoolYear } from "@/app/context/SchoolYearContext";

const schema = z
  .object({
    label: z.string().min(1, "Label is required (e.g., Semester 1)"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    schoolYearId: z.string().min(1, "School year is required"),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: {
    label: string;
    startDate: string;
    endDate: string;
    schoolYearId: number;
  }) => Promise<void>;
  onError: (msg: string) => void;
}

export function PeriodForm({ onSubmit, onError }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const { schoolYears } = useSchoolYear();
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
      await onSubmit({
        label: data.label,
        startDate: data.startDate,
        endDate: data.endDate,
        schoolYearId: Number(data.schoolYearId),
      });
      reset();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sticky top-12 bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-gray-900 rounded-xl">
          <FiPlus className="text-white text-lg" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">New period</h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="label"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiTag className="text-gray-400" /> Label
          </label>
          <input
            id="label"
            {...register("label")}
            placeholder="e.g. Semester 1"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
          {errors.label && (
            <p className="text-red-500 text-xs">{errors.label.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="schoolYearId"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiBookOpen className="text-gray-400" /> School Year
          </label>
          <select
            id="schoolYearId"
            {...register("schoolYearId")}
            className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          >
            <option value="">Select a school year</option>
            {schoolYears.map((sy) => (
              <option key={sy.schoolYearId} value={String(sy.schoolYearId)}>
                {sy.label} ({sy.status})
              </option>
            ))}
          </select>
          {errors.schoolYearId && (
            <p className="text-red-500 text-xs">
              {errors.schoolYearId.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="startDate"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiCalendar className="text-gray-400" /> Start date
          </label>
          <input
            id="startDate"
            type="date"
            {...register("startDate")}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
          {errors.startDate && (
            <p className="text-red-500 text-xs">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="endDate"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiCalendar className="text-gray-400" /> End date
          </label>
          <input
            id="endDate"
            type="date"
            {...register("endDate")}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
          {errors.endDate && (
            <p className="text-red-500 text-xs">{errors.endDate.message}</p>
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
            "Create period"
          )}
        </button>
      </form>
    </div>
  );
}
