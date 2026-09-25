import { AttendanceStatus } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  studentId: z.number().int().positive(),
  scheduleId: z.number().int().positive(),
  date: z.string().datetime(),
  status: z.nativeEnum(AttendanceStatus),
  reason: z.string().trim().optional(),
});
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(user.role))
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const classId = Number(new URL(req.url).searchParams.get("classId"));
  const where = {
    ...(Number.isInteger(classId) ? { student: { classId } } : {}),
    ...(user.role === "INSTRUCTOR"
      ? { schedule: { assignment: { teacherId: user.userId } } }
      : {}),
  };
  return NextResponse.json(
    await prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        student: true,
        schedule: { include: { assignment: { include: { course: true } } } },
      },
    }),
  );
}
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(user.role))
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  const date = new Date(parsed.data.date);
  date.setUTCHours(0, 0, 0, 0);
  const schedule = await prisma.schedule.findUnique({
    where: { scheduleId: parsed.data.scheduleId },
    include: { assignment: true },
  });
  if (!schedule)
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  const student = await prisma.student.findUnique({
    where: { studentId: parsed.data.studentId },
    select: { classId: true },
  });
  if (!student)
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  if (student.classId !== schedule.assignment.classId) {
    return NextResponse.json(
      { error: "Student is not enrolled in the scheduled class" },
      { status: 409 },
    );
  }
  if (
    user.role === "INSTRUCTOR" &&
    schedule.assignment.teacherId !== user.userId
  ) {
    return NextResponse.json(
      { error: "You can only record attendance for your courses" },
      { status: 403 },
    );
  }
  const attendance = await prisma.attendance.upsert({
    where: {
      studentId_scheduleId_date: {
        studentId: parsed.data.studentId,
        scheduleId: parsed.data.scheduleId,
        date,
      },
    },
    create: {
      ...parsed.data,
      date,
      reason: parsed.data.reason || null,
      recordedById: user.userId,
    },
    update: {
      status: parsed.data.status,
      reason: parsed.data.reason || null,
      recordedById: user.userId,
    },
  });
  return NextResponse.json(
    { message: "Attendance recorded", attendance },
    { status: 201 },
  );
}
