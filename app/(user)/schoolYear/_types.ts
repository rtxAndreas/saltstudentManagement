export interface SchoolYear {
  schoolYearId: number;
  label: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}
