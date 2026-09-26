"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiCalendar,
  FiLoader,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiTag,
  FiUser,
} from "react-icons/fi";
import * as z from "zod";
import type { Class } from "../../class/_types";
import type { Student } from "../_types";

const schema = z.object({
  registrationNumber: z.string().optional(),
  lastname: z.string().min(1, "Lastname is required"),
  firstname: z.string().min(1, "Firstname is required"),
  gender: z.enum(["MALE", "FEMALE"], "Gender is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  birthPlace: z.string().optional(),
  address: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().optional(),
  classId: z.string().min(1, "Class is required"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: {
    lastname: string;
    firstname: string;
    gender: "MALE" | "FEMALE";
    birthDate: string;
    classId: number;
    registrationNumber?: string;
    birthPlace?: string;
    address?: string;
    parentPhone?: string;
    parentEmail?: string;
  }) => Promise<void>;
  onError: (msg: string) => void;
  editingStudent?: Student | null;
  onCancelEdit?: () => void;
}

export function StudentForm({
  onSubmit,
  onError,
  editingStudent,
  onCancelEdit,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch("/api/class");
        if (res.ok) {
          const data = await res.json();
          setClasses(data);
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
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
      registrationNumber: "",
      lastname: "",
      firstname: "",
      gender: undefined,
      birthDate: "",
      birthPlace: "",
      address: "",
      parentPhone: "",
      parentEmail: "",
      classId: "",
    },
  });

  useEffect(() => {
    if (editingStudent) {
      setValue("registrationNumber", editingStudent.registrationNumber ?? "");
      setValue("lastname", editingStudent.lastname);
      setValue("firstname", editingStudent.firstname);
      setValue("gender", editingStudent.gender);
      setValue("birthDate", editingStudent.birthDate.split("T")[0]);
      setValue("birthPlace", editingStudent.birthPlace ?? "");
      setValue("address", editingStudent.address ?? "");
      setValue("parentPhone", editingStudent.parentPhone ?? "");
      setValue("parentEmail", editingStudent.parentEmail ?? "");
      setValue("classId", String(editingStudent.classId));
    } else {
      reset({
        registrationNumber: "",
        lastname: "",
        firstname: "",
        gender: undefined,
        birthDate: "",
        birthPlace: "",
        address: "",
        parentPhone: "",
        parentEmail: "",
        classId: "",
      });
    }
  }, [editingStudent, setValue, reset]);

  const handleFormSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await onSubmit({
        registrationNumber: data.registrationNumber || undefined,
        lastname: data.lastname,
        firstname: data.firstname,
        gender: data.gender,
        birthDate: data.birthDate,
        birthPlace: data.birthPlace || undefined,
        address: data.address || undefined,
        parentPhone: data.parentPhone || undefined,
        parentEmail: data.parentEmail || undefined,
        classId: Number(data.classId),
      });
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
        <h2 className="text-lg font-semibold text-gray-900">
          {editingStudent ? "Edit student" : "New student"}
        </h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="registrationNumber"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiTag className="text-gray-400" /> Registration Number
          </label>
          <input
            id="registrationNumber"
            {...register("registrationNumber")}
            placeholder="e.g. STU-001"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="lastname"
              className="text-sm font-medium text-gray-600 flex items-center gap-2"
            >
              <FiUser className="text-gray-400" /> Lastname
            </label>
            <input
              id="lastname"
              {...register("lastname")}
              placeholder="e.g. Doe"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
            />
            {errors.lastname && (
              <p className="text-red-500 text-xs">{errors.lastname.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="firstname"
              className="text-sm font-medium text-gray-600 flex items-center gap-2"
            >
              <FiUser className="text-gray-400" /> Firstname
            </label>
            <input
              id="firstname"
              {...register("firstname")}
              placeholder="e.g. John"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
            />
            {errors.firstname && (
              <p className="text-red-500 text-xs">{errors.firstname.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="gender"
              className="text-sm font-medium text-gray-600 flex items-center gap-2"
            >
              <FiUser className="text-gray-400" /> Gender
            </label>
            <select
              id="gender"
              {...register("gender")}
              className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            {errors.gender && (
              <p className="text-red-500 text-xs">{errors.gender.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="birthDate"
              className="text-sm font-medium text-gray-600 flex items-center gap-2"
            >
              <FiCalendar className="text-gray-400" /> Birth Date
            </label>
            <input
              id="birthDate"
              type="date"
              {...register("birthDate")}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
            />
            {errors.birthDate && (
              <p className="text-red-500 text-xs">{errors.birthDate.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="classId"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiTag className="text-gray-400" /> Class
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
            htmlFor="birthPlace"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiMapPin className="text-gray-400" /> Birth Place
          </label>
          <input
            id="birthPlace"
            {...register("birthPlace")}
            placeholder="e.g. Douala"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="address"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiMapPin className="text-gray-400" /> Address
          </label>
          <input
            id="address"
            {...register("address")}
            placeholder="e.g. Rue 1.234 Bonamoussadi"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="parentPhone"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiPhone className="text-gray-400" /> Parent Phone
          </label>
          <input
            id="parentPhone"
            {...register("parentPhone")}
            placeholder="e.g. +237 6XX XXX XXX"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="parentEmail"
            className="text-sm font-medium text-gray-600 flex items-center gap-2"
          >
            <FiTag className="text-gray-400" /> Parent Email
          </label>
          <input
            id="parentEmail"
            type="email"
            {...register("parentEmail")}
            placeholder="e.g. parent@example.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2">
          {editingStudent && (
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
            ) : editingStudent ? (
              "Save changes"
            ) : (
              "Create student"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
