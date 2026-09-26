"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiBookOpen, FiHash, FiLayers, FiLoader, FiTag } from "react-icons/fi";
import * as z from "zod";
import type { Class } from "../../class/_types";
import type { Course } from "../_types";

const schema = z.object({
  name: z.string().min(1, "Name is required (e.g., Mathematics)"),
  code: z.string().min(1, "Code is required (e.g., MATH-101)"),
  coefficient: z.number().int().min(1, "Coefficient must be at least 1"),
  classIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: {
    name: string;
    code: string;
    coefficient: number;
    classIds: number[];
  }) => Promise<void>;
  onError: (msg: string) => void;
  editingCourse?: Course | null;
  onCancelEdit?: () => void;
}

export function CourseForm({
  onSubmit,
  onError,
  editingCourse,
  onCancelEdit,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  // Fetch classes to assign to course
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch("/api/class");
        if (res.ok) {
          const data = await res.json();
          setClasses(data);
        }
      } catch (err) {
        console.error("Failed to load classes in form:", err);
      } finally {
        setClassesLoading(false);
      }
    }
    fetchClasses();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      coefficient: 1,
      classIds: [],
    },
  });

  // Reset form when editingCourse changes
  useEffect(() => {
    if (editingCourse) {
      setValue("name", editingCourse.name);
      setValue("code", editingCourse.code);
      setValue("coefficient", editingCourse.coefficient);
      setValue(
        "classIds",
        editingCourse.classes.map((cls) => String(cls.classId)),
      );
    } else {
      reset({
        name: "",
        code: "",
        coefficient: 1,
        classIds: [],
      });
    }
  }, [editingCourse, setValue, reset]);

  const handleFormSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        code: data.code,
        coefficient: data.coefficient,
        classIds: data.classIds.map(Number),
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
          <FiTag className="text-gray-400" /> Name (Course Name)
        </label>
        <input
          id="name"
          {...register("name")}
          placeholder="e.g. Mathematics"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        />
        {errors.name && (
          <p className="text-red-500 text-xs">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="code"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiHash className="text-gray-400" /> Code (Course Code)
        </label>
        <input
          id="code"
          {...register("code")}
          placeholder="e.g. MATH-101"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        />
        {errors.code && (
          <p className="text-red-500 text-xs">{errors.code.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="coefficient"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiBookOpen className="text-gray-400" /> Coefficient
        </label>
        <input
          id="coefficient"
          type="number"
          {...register("coefficient", { valueAsNumber: true })}
          placeholder="e.g. 4"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        />
        {errors.coefficient && (
          <p className="text-red-500 text-xs">{errors.coefficient.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <FiLayers className="text-gray-400" /> Classes
        </span>
        {classesLoading ? (
          <p className="text-xs text-gray-400">Loading classes...</p>
        ) : classes.length === 0 ? (
          <p className="text-xs text-gray-400">
            No classes available. Create a class first.
          </p>
        ) : (
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
            {classes.map((cls) => (
              <label
                key={cls.classId}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-1.5 rounded transition-all"
              >
                <input
                  type="checkbox"
                  value={cls.classId}
                  {...register("classIds")}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-950 accent-gray-900"
                />
                <span>
                  {cls.name}{" "}
                  <span className="text-xs text-gray-400">({cls.level})</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {editingCourse && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl text-sm transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <FiLoader className="animate-spin" /> Saving...
            </>
          ) : editingCourse ? (
            "Save changes"
          ) : (
            "Create course"
          )}
        </button>
      </div>
    </form>
  );
}
