import type { Class } from "../class/_types";

export interface Student {
  studentId: number;
  registrationNumber?: string | null;
  lastname: string;
  firstname: string;
  gender: "MALE" | "FEMALE";
  birthDate: string;
  birthPlace?: string | null;
  address?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  status: "ACTIVE" | "INACTIVE";
  classId: number;
  class?: Class;
  createdAt: string;
  updatedAt: string;
}
