import type { Class } from "../class/_types";
import type { Course } from "../course/_types";
import type { Grade } from "../grade/_types";
import type { SchoolYear } from "../schoolYear/_types";
import type { User } from "../users/_types";

export interface Assignment {
  assignmentId: number;
  teacherId: number;
  classId: number;
  courseId: number;
  schoolYearId: number;
  teacher?: Pick<User, "userId" | "name" | "lastname">;
  class?: Class;
  course?: Course;
  schoolYear?: SchoolYear;
  grades?: Grade[];
  createdAt: string;
  updatedAt: string;
}
