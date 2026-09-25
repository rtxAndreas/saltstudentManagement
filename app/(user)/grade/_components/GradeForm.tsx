"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiBookOpen, FiEdit3, FiLoader, FiTag, FiUser } from "react-icons/fi";
import * as z from "zod";
import type { Assignment } from "../../assignment/_types";
import type { Period } from "../../period/_types";
import type { Student } from "../../student/_types";

const schema = z
  .object({
    value: z.number().min(0, "Value must be positive"),
    maxScore: z.number().min(1, "Max score must be at least 1"),
    comment: z.string().optional(),
    studentId: z.string().min(1, "Student is required"),
    periodId: z.string().min(1, "Period is required"),
    assignmentId: z.string().min(1, "Assignment is required"),
    assessmentId: z.string().optional(),
  })
  .refine((d) => d.value <= d.maxScore, {
    message: "Value cannot exceed max score",
    path: ["value"],
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: {
    value: number;
    maxScore: number;
    comment?: string;
    studentId: number;
    periodId: number;
    assignmentId: number;
    assessmentId?: number;
  }) => Promise<void>;
  onError: (msg: string) => void;
}

export function GradeForm({ onSubmit, onError }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [assessments, setAssessments] = useState<
    Array<{
      assessmentId: number;
      title: string;
      maxScore: number;
      assignmentId: number;
      periodId: number;
      assignment: { course: { name: string }; class: { name: string } };
    }>
  >([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [periodsLoading, setPeriodsLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/student");
        if (res.ok) setStudents(await res.json());
      } catch (err) {
        console.error("Failed to load students:", err);
      } finally {
        setStudentsLoading(false);
      }
    }
    fetchStudents();
  }, []);

  useEffect(() => {
    fetch("/api/assessments")
      .then((res) => (res.ok ? res.json() : []))
      .then(setAssessments)
      .catch(() => setAssessments([]));
  }, []);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await fetch("/api/assignment");
        if (res.ok) setAssignments(await res.json());
      } catch (err) {
        console.error("Failed to load assignments:", err);
      } finally {
        setAssignmentsLoading(false);
      }
    }
    fetchAssignments();
  }, []);

  useEffect(() => {
    async function fetchPeriods() {
      try {
        const res = await fetch("/api/period");
        if (res.ok) setPeriods(await res.json());
      } catch (err) {
        console.error("Failed to load periods:", err);
      } finally {
        setPeriodsLoading(false);
      }
    }
    fetchPeriods();
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
      value: 0,
      maxScore: 20,
      comment: "",
      studentId: "",
      periodId: "",
      assignmentId: "",
      assessmentId: "",
    },
  });

  const handleFormSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await onSubmit({
        value: data.value,
        maxScore: data.maxScore,
        comment: data.comment || undefined,
        studentId: Number(data.studentId),
        periodId: Number(data.periodId),
        assignmentId: Number(data.assignmentId),
        assessmentId: data.assessmentId ? Number(data.assessmentId) : undefined,
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
          htmlFor="assessmentId"
          className="text-sm font-medium text-gray-600"
        >
          Évaluation
        </label>
        <select
          id="assessmentId"
          {...register("assessmentId", {
            onChange: (event) => {
              const selected = assessments.find(
                (item) => item.assessmentId === Number(event.target.value),
              );
              if (selected) {
                setValue("assignmentId", String(selected.assignmentId));
                setValue("periodId", String(selected.periodId));
                setValue("maxScore", selected.maxScore);
              }
            },
          })}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
        >
          <option value="">Note libre (ancien mode)</option>
          {assessments.map((item) => (
            <option key={item.assessmentId} value={item.assessmentId}>
              {item.title} · {item.assignment.course.name} ·{" "}
              {item.assignment.class.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="studentId"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiUser className="text-gray-400" /> Student
        </label>
        <select
          id="studentId"
          {...register("studentId")}
          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        >
          <option value="">Select a student</option>
          {studentsLoading ? (
            <option disabled>Loading students...</option>
          ) : (
            students.map((student) => (
              <option key={student.studentId} value={String(student.studentId)}>
                {student.firstname} {student.lastname}
              </option>
            ))
          )}
        </select>
        {errors.studentId && (
          <p className="text-red-500 text-xs">{errors.studentId.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="assignmentId"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiBookOpen className="text-gray-400" /> Assignment
        </label>
        <select
          id="assignmentId"
          {...register("assignmentId")}
          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        >
          <option value="">Select an assignment</option>
          {assignmentsLoading ? (
            <option disabled>Loading assignments...</option>
          ) : (
            assignments.map((assignment) => (
              <option
                key={assignment.assignmentId}
                value={String(assignment.assignmentId)}
              >
                {assignment.course?.name ?? "Assignment"}{" "}
                {assignment.class?.name ? `- ${assignment.class.name}` : ""}
              </option>
            ))
          )}
        </select>
        {errors.assignmentId && (
          <p className="text-red-500 text-xs">{errors.assignmentId.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="periodId"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiTag className="text-gray-400" /> Period
        </label>
        <select
          id="periodId"
          {...register("periodId")}
          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        >
          <option value="">Select a period</option>
          {periodsLoading ? (
            <option disabled>Loading periods...</option>
          ) : (
            periods.map((period) => (
              <option key={period.periodId} value={String(period.periodId)}>
                {period.label}
              </option>
            ))
          )}
        </select>
        {errors.periodId && (
          <p className="text-red-500 text-xs">{errors.periodId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            htmlFor="value"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiEdit3 className="text-gray-400" /> Value
          </label>
          <input
            id="value"
            type="number"
            step="0.25"
            {...register("value", { valueAsNumber: true })}
            placeholder="e.g. 15"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
          {errors.value && (
            <p className="text-red-500 text-xs">{errors.value.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="maxScore"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiTag className="text-gray-400" /> Max Score
          </label>
          <input
            id="maxScore"
            type="number"
            step="0.5"
            {...register("maxScore", { valueAsNumber: true })}
            placeholder="e.g. 20"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
          {errors.maxScore && (
            <p className="text-red-500 text-xs">{errors.maxScore.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="comment"
          className="text-sm font-medium text-gray-600 flex items-center gap-2"
        >
          <FiEdit3 className="text-gray-400" /> Comment
        </label>
        <textarea
          id="comment"
          {...register("comment")}
          placeholder="e.g. Good work"
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
        />
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
          "Create grade"
        )}
      </button>
    </form>
  );
}
