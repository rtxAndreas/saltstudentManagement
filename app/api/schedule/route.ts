import { DayOfWeek } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth";
import { verifyAdminAccess, verifyUserAccess } from "@/lib/guards";
import { getClassRecipientIds } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { validateScheduleSlot } from "@/lib/scheduleRules";

const scheduleSchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format must be HH:mm (00:00–23:59)"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format must be HH:mm (00:00–23:59)"),
  classroomId: z.number().int().positive("Classroom is required").optional(),
  assignmentId: z.number().int().positive("Assignment is required"),
  schoolYearId: z.number().int().positive("School year is required"),
});

const scheduleUpdateSchema = scheduleSchema.extend({
  id: z.number().int().positive(),
});

const scheduleStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["SCHEDULED", "CANCELLED", "RESCHEDULED", "COMPLETED"]),
  cancellationReason: z.string().trim().min(3).optional(),
});

const scheduleInclude = {
  assignment: {
    include: {
      teacher: { select: { userId: true, name: true, lastname: true } },
      class: { select: { classId: true, name: true, level: true } },
      course: { select: { courseId: true, name: true, code: true } },
    },
  },
  classroom: {
    select: {
      classroomId: true,
      name: true,
      capacity: true,
      building: true,
    },
  },
  schoolYear: { select: { schoolYearId: true, label: true } },
};

function conflictResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export async function GET(req: NextRequest) {
  try {
    const accessError = await verifyUserAccess(req);
    if (accessError) return accessError;

    const { searchParams } = new URL(req.url);
    const dayOfWeek = searchParams.get("dayOfWeek");
    const schoolYearId = searchParams.get("schoolYearId");
    const assignmentId = searchParams.get("assignmentId");
    const classroomId = searchParams.get("classroomId");
    const teacherId = searchParams.get("teacherId");
    const level = searchParams.get("level");

    const where: Record<string, unknown> = {};
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;
    if (schoolYearId) where.schoolYearId = Number(schoolYearId);
    if (assignmentId) where.assignmentId = Number(assignmentId);
    if (classroomId) where.classroomId = Number(classroomId);
    const assignmentFilter: Record<string, unknown> = {};
    if (teacherId) assignmentFilter.teacherId = Number(teacherId);
    if (level) assignmentFilter.class = { level };
    const user = await getUserFromRequest(req);
    if (user?.role === "INSTRUCTOR") {
      assignmentFilter.teacherId = user.userId;
    }
    if (Object.keys(assignmentFilter).length)
      where.assignment = assignmentFilter;

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: scheduleInclude,
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("GET /api/schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = scheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validation = await validateScheduleSlot(parsed.data);
    if (!validation.ok) {
      return conflictResponse(validation.conflict.message);
    }

    const schedule = await prisma.schedule.create({
      data: {
        dayOfWeek: parsed.data.dayOfWeek,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        classroomId: parsed.data.classroomId || null,
        assignmentId: parsed.data.assignmentId,
        schoolYearId: parsed.data.schoolYearId,
      },
      include: scheduleInclude,
    });

    return NextResponse.json(
      { message: "Créneau créé avec succès", schedule },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** Move or edit an existing slot: same business rules, excluding itself. */
export async function PUT(req: NextRequest) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    const parsed = scheduleUpdateSchema.safeParse(
      await req.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id, ...slot } = parsed.data;
    const current = await prisma.schedule.findUnique({
      where: { scheduleId: id },
    });
    if (!current) {
      return NextResponse.json(
        { error: "Créneau introuvable." },
        { status: 404 },
      );
    }

    const validation = await validateScheduleSlot({
      ...slot,
      excludeScheduleId: id,
    });
    if (!validation.ok) {
      return conflictResponse(validation.conflict.message);
    }

    const schedule = await prisma.schedule.update({
      where: { scheduleId: id },
      data: {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        classroomId: slot.classroomId || null,
        assignmentId: slot.assignmentId,
        schoolYearId: slot.schoolYearId,
        // A moved slot is scheduled again unless explicitly cancelled later
        status: "SCHEDULED",
        cancellationReason: null,
        cancelledAt: null,
      },
      include: scheduleInclude,
    });

    return NextResponse.json({
      message: "Créneau modifié avec succès",
      schedule,
    });
  } catch (error) {
    console.error("PUT /api/schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  const parsed = scheduleStatusSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (
    !parsed.success ||
    (parsed.data.status === "CANCELLED" && !parsed.data.cancellationReason)
  ) {
    return NextResponse.json(
      { error: "A cancellation reason is required" },
      { status: 400 },
    );
  }
  const current = await prisma.schedule.findUnique({
    where: { scheduleId: parsed.data.id },
    include: { assignment: { include: { course: true, class: true } } },
  });
  if (!current)
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  if (
    user.role === "INSTRUCTOR" &&
    current.assignment.teacherId !== user.userId
  ) {
    return NextResponse.json(
      { error: "You can only update your own course" },
      { status: 403 },
    );
  }
  const updated = await prisma.$transaction(async (tx) => {
    const schedule = await tx.schedule.update({
      where: { scheduleId: current.scheduleId },
      data: {
        status: parsed.data.status,
        cancellationReason:
          parsed.data.status === "CANCELLED"
            ? parsed.data.cancellationReason
            : null,
        cancelledAt: parsed.data.status === "CANCELLED" ? new Date() : null,
      },
    });
    if (parsed.data.status === "CANCELLED") {
      const recipientIds = await getClassRecipientIds(
        tx,
        current.assignment.classId,
      );
      if (recipientIds.length) {
        await tx.notification.create({
          data: {
            title: `Cours annulé — ${current.assignment.course.name}`,
            message: `${current.assignment.course.name}, ${current.dayOfWeek} de ${current.startTime} à ${current.endTime}. Motif : ${parsed.data.cancellationReason}`,
            type: "COURSE_CANCELLED",
            audience: "CLASS",
            classId: current.assignment.classId,
            createdById: user.userId,
            recipients: { create: recipientIds.map((userId) => ({ userId })) },
          },
        });
      }
    }
    return schedule;
  });
  return NextResponse.json({
    message: "Schedule status updated",
    schedule: updated,
  });
}
