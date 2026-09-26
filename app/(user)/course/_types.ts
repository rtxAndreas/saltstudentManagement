import type { Class } from "../class/_types";

export interface Course {
  courseId: number;
  name: string;
  code: string;
  coefficient: number;
  statusCourse: "ACTIVE" | "INACTIVE";
  classes: Class[];
  createdAt: string;
  updatedAt: string;
}
