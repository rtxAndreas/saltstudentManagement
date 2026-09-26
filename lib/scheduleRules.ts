import { type DayOfWeek, Status } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Overlap rule (EDT §5): newStart < existingEnd AND newEnd > existingStart.
 * Times are "HH:mm" strings, so lexicographic comparison is correct.
 */
export function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export interface ScheduleSlotInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  classroomId?: number | null;
  assignmentId: number;
  schoolYearId: number;
  /** Skip the slot being edited so it does not conflict with itself. */
  excludeScheduleId?: number;
}

export type ScheduleSlotConflict =
  | { code: "INVALID_TIME"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "YEAR_MISMATCH"; message: string }
  | { code: "INACTIVE"; message: string }
  | { code: "TEACHER_CONFLICT"; message: string }
  | { code: "CLASS_CONFLICT"; message: string }
  | { code: "ROOM_CONFLICT"; message: string }
  | { code: "ROOM_CAPACITY"; message: string };

type ValidationResult =
  | { ok: true }
  | { ok: false; conflict: ScheduleSlotConflict };

/**
 * Centralized server-side schedule validation (EDT-001 … EDT-008).
 * EDT-006 (teacher availability) is not modeled yet; the check will plug in
 * here without touching the API routes.
 */
export async function validateScheduleSlot(
  input: ScheduleSlotInput,
): Promise<ValidationResult> {
  const {
    dayOfWeek,
    startTime,
    endTime,
    classroomId,
    assignmentId,
    schoolYearId,
    excludeScheduleId,
  } = input;

  // EDT-007: time validity
  if (!(startTime < endTime)) {
    return {
      ok: false,
      conflict: {
        code: "INVALID_TIME",
        message: "L'heure de fin doit être postérieure à l'heure de début.",
      },
    };
  }

  const assignment = await prisma.assignment.findUnique({
    where: { assignmentId },
    include: {
      teacher: {
        select: { userId: true, name: true, lastname: true, status: true },
      },
      class: { select: { classId: true, name: true, status: true } },
      course: { select: { courseId: true, name: true } },
    },
  });
  // EDT-004: the teacher/class/course triple must come from a real assignment
  if (!assignment) {
    return {
      ok: false,
      conflict: {
        code: "NOT_FOUND",
        message:
          "Cet enseignant n'est pas affecté à cette matière pour cette classe.",
      },
    };
  }

  // EDT-008: same school-year context, active class and teacher
  if (assignment.schoolYearId !== schoolYearId) {
    return {
      ok: false,
      conflict: {
        code: "YEAR_MISMATCH",
        message: "L'affectation et l'année scolaire ne correspondent pas.",
      },
    };
  }
  if (assignment.teacher.status !== Status.ACTIVE) {
    return {
      ok: false,
      conflict: {
        code: "INACTIVE",
        message: "Cet enseignant n'est pas actif.",
      },
    };
  }
  if (assignment.class.status !== Status.ACTIVE) {
    return {
      ok: false,
      conflict: { code: "INACTIVE", message: "Cette classe n'est pas active." },
    };
  }

  const classroom = classroomId
    ? await prisma.classroom.findUnique({ where: { classroomId } })
    : null;
  if (classroomId && !classroom) {
    return {
      ok: false,
      conflict: { code: "NOT_FOUND", message: "Salle introuvable." },
    };
  }

  // Overlapping candidates for that day and school year (cancelled courses do not block)
  const existingSchedules = await prisma.schedule.findMany({
    where: {
      dayOfWeek,
      schoolYearId,
      status: { not: "CANCELLED" },
      ...(excludeScheduleId ? { scheduleId: { not: excludeScheduleId } } : {}),
    },
    include: {
      assignment: {
        include: {
          teacher: { select: { userId: true, name: true, lastname: true } },
          class: { select: { classId: true, name: true } },
          course: { select: { courseId: true, name: true } },
        },
      },
      classroom: { select: { classroomId: true, name: true } },
    },
  });

  for (const existing of existingSchedules) {
    if (
      !timesOverlap(startTime, endTime, existing.startTime, existing.endTime)
    ) {
      continue;
    }

    // EDT-001: teacher overlap
    if (existing.assignment.teacherId === assignment.teacherId) {
      const teacher = assignment.teacher;
      return {
        ok: false,
        conflict: {
          code: "TEACHER_CONFLICT",
          message: `Conflit d'emploi du temps : ${teacher.name} ${teacher.lastname} possède déjà un cours de ${existing.startTime} à ${existing.endTime}.`,
        },
      };
    }

    // EDT-002: class overlap
    if (existing.assignment.classId === assignment.classId) {
      return {
        ok: false,
        conflict: {
          code: "CLASS_CONFLICT",
          message:
            "Conflit : cette classe possède déjà un cours sur ce créneau.",
        },
      };
    }

    // EDT-003: room overlap
    if (classroomId && existing.classroomId === classroomId) {
      return {
        ok: false,
        conflict: {
          code: "ROOM_CONFLICT",
          message: `Conflit de salle : la salle ${classroom?.name ?? ""} est déjà occupée sur ce créneau.`,
        },
      };
    }
  }

  // EDT-005: room capacity vs class size
  if (classroom?.capacity != null) {
    const studentCount = await prisma.student.count({
      where: { classId: assignment.classId, status: Status.ACTIVE },
    });
    if (studentCount > classroom.capacity) {
      return {
        ok: false,
        conflict: {
          code: "ROOM_CAPACITY",
          message:
            "La capacité de cette salle est insuffisante pour cette classe.",
        },
      };
    }
  }

  return { ok: true };
}
