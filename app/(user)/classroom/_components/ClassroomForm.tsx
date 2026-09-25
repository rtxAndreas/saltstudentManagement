"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiHash, FiLoader, FiMapPin, FiUsers } from "react-icons/fi";
import * as z from "zod";

const schema = z.object({
  name: z.string().min(1, "Classroom name is required"),
  capacity: z
    .string()
    .optional()
    .refine((v) => v === "" || Number(v) > 0, {
      message: "Capacity must be positive",
    }),
  building: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: {
    name: string;
    capacity?: number;
    building?: string;
  }) => Promise<void>;
  onError: (msg: string) => void;
}

export function ClassroomForm({ onSubmit, onError }: Props) {
  const [submitting, setSubmitting] = useState(false);
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
        name: data.name,
        capacity: data.capacity ? Number(data.capacity) : undefined,
        building: data.building || undefined,
      });
      reset();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiHash className="text-gray-400" /> Name
        </label>
        <input
          id="name"
          {...register("name")}
          placeholder="e.g. Salle 101"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        />
        {errors.name && (
          <p className="text-red-500 text-xs">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="building"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiMapPin className="text-gray-400" /> Building (optional)
        </label>
        <input
          id="building"
          {...register("building")}
          placeholder="e.g. Bâtiment A"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="capacity"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiUsers className="text-gray-400" /> Capacity (optional)
        </label>
        <input
          id="capacity"
          type="number"
          min={1}
          {...register("capacity")}
          placeholder="e.g. 40"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        />
        {errors.capacity && (
          <p className="text-red-500 text-xs">{errors.capacity.message}</p>
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
          "Create classroom"
        )}
      </button>
    </form>
  );
}
