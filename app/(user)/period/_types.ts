import type { SchoolYear } from "../schoolYear/_types";

export interface Period {
  periodId: number;
  label: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "CLOSED";
  schoolYearId: number;
  schoolYear?: SchoolYear;
  createdAt: string;
}
