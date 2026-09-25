export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export interface Schedule {
  scheduleId: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  classroomId?: number | null;
  assignmentId: number;
  schoolYearId: number;
  status: "SCHEDULED" | "CANCELLED" | "RESCHEDULED" | "COMPLETED";
  cancellationReason?: string | null;
  classroom?: {
    classroomId: number;
    name: string;
    capacity?: number | null;
    building?: string | null;
  };
  assignment?: {
    assignmentId: number;
    teacher?: { userId: number; name: string; lastname: string };
    class?: { classId: number; name: string; level: string };
    course?: { courseId: number; name: string; code: string };
  };
  schoolYear?: { schoolYearId: number; label: string };
  createdAt: string;
}
