import type { Assignment } from "../assignment/_types";
import type { Period } from "../period/_types";
import type { Student } from "../student/_types";
import type { User } from "../users/_types";

export interface Grade {
  gradeId: number;
  value: number;
  maxScore: number;
  comment?: string | null;
  studentId: number;
  periodId: number;
  assignmentId: number;
  createdById: number;
  student?: Student;
  period?: Period;
  assignment?: Assignment;
  createdBy?: Pick<User, "userId" | "name" | "lastname">;
  createdAt: string;
  updatedAt: string;
}
