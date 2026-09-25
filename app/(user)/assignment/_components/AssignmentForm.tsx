"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiBookOpen, FiLayers, FiLoader, FiTag, FiUser } from "react-icons/fi";
import * as z from "zod";
import { useSchoolYear } from "@/app/context/SchoolYearContext";
import type { Class } from "../../class/_types";
import type { Course } from "../../course/_types";
import type { User } from "../../users/_types";

const schema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  classId: z.string().min(1, "Class is required"),
  courseId: z.string().min(1, "Course is required"),
  schoolYearId: z.string().min(1, "School year is required"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: {
    teacherId: number;
    classId: number;
    courseId: number;
    schoolYearId: number;
  }) => Promise<void>;
  onError: (msg: string) => void;
}

export function AssignmentForm({ onSubmit, onError }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const { schoolYears } = useSchoolYear();

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = (await res.json()) as User[];
          setTeachers(
            data.filter(
              (u) => u.role === "INSTRUCTOR" && u.status === "ACTIVE",
            ),
          );
        }
      } catch (err) {
        console.error("Failed to load teachers:", err);
      } finally {
        setTeachersLoading(false);
      }
    }
    fetchTeachers();
  }, []);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch("/api/class");
        if (res.ok) setClasses(await res.json());
      } catch (err) {
        console.error("Failed to load classes:", err);
      } finally {
        setClassesLoading(false);
      }
    }
    fetchClasses();
  }, []);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/course");
        if (res.ok) setCourses(await res.json());
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setCoursesLoading(false);
      }
    }
    fetchCourses();
  }, []);

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
        teacherId: Number(data.teacherId),
        classId: Number(data.classId),
        courseId: Number(data.courseId),
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="teacherId"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiUser className="text-gray-400" /> Teacher
        </label>
        <select
          id="teacherId"
          {...register("teacherId")}
          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        >
          <option value="">Select a teacher</option>
          {teachersLoading ? (
            <option disabled>Loading teachers...</option>
          ) : (
            teachers.map((teacher) => (
              <option key={teacher.userId} value={String(teacher.userId)}>
                {teacher.name} {teacher.lastname}
              </option>
            ))
          )}
        </select>
        {errors.teacherId && (
          <p className="text-red-500 text-xs">{errors.teacherId.message}</p>
        )}
        {!teachersLoading && teachers.length === 0 && (
          <p className="text-xs text-gray-400">
            No active instructors available.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="classId"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiLayers className="text-gray-400" /> Class
        </label>
        <select
          id="classId"
          {...register("classId")}
          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        >
          <option value="">Select a class</option>
          {classesLoading ? (
            <option disabled>Loading classes...</option>
          ) : (
            classes.map((cls) => (
              <option key={cls.classId} value={String(cls.classId)}>
                {cls.name} ({cls.level})
              </option>
            ))
          )}
        </select>
        {errors.classId && (
          <p className="text-red-500 text-xs">{errors.classId.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="courseId"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiBookOpen className="text-gray-400" /> Course
        </label>
        <select
          id="courseId"
          {...register("courseId")}
          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        >
          <option value="">Select a course</option>
          {coursesLoading ? (
            <option disabled>Loading courses...</option>
          ) : (
            courses.map((course) => (
              <option key={course.courseId} value={String(course.courseId)}>
                {course.name} ({course.code})
              </option>
            ))
          )}
        </select>
        {errors.courseId && (
          <p className="text-red-500 text-xs">{errors.courseId.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="schoolYearId"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiTag className="text-gray-400" /> School Year
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
          <p className="text-red-500 text-xs">{errors.schoolYearId.message}</p>
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
          "Create assignment"
        )}
      </button>
    </form>
  );
}
