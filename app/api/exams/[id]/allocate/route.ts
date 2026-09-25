import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildSeatingPlan, type SeatingAllocation } from "@/lib/exams/seating";
import { verifyAdminAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  classroomIds: z.array(z.number().int().positive()).min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessError = await verifyAdminAccess(req);
  if (accessError) return accessError;
  const examSessionId = Number((await params).id);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!Number.isInteger(examSessionId) || !parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const session = await prisma.examSession.findUnique({
    where: { examSessionId },
  });
  if (!session)
    return NextResponse.json(
      { error: "Exam session not found" },
      { status: 404 },
    );

  const [students, classrooms] = await Promise.all([
    prisma.student.findMany({
      where: {
        status: "ACTIVE",
        class: { schoolYearId: session.schoolYearId },
      },
      orderBy: [{ classId: "asc" }, { lastname: "asc" }, { firstname: "asc" }],
      include: {
        user: { select: { userId: true } },
        guardians: { include: { guardian: { select: { userId: true } } } },
      },
    }),
    prisma.classroom.findMany({
      where: { classroomId: { in: parsed.data.classroomIds } },
      orderBy: { name: "asc" },
    }),
  ]);
  if (classrooms.length !== new Set(parsed.data.classroomIds).size) {
    return NextResponse.json(
      { error: "One or more classrooms were not found" },
      { status: 404 },
    );
  }

  // EXAM-001: a student cannot have two exams at the same time
  const studentClash = await prisma.examRoomAllocation.findFirst({
    where: {
      examSessionId: { not: examSessionId },
      studentId: { in: students.map((student) => student.studentId) },
      examSession: {
        startDate: { lt: session.endDate },
        endDate: { gt: session.startDate },
      },
    },
    include: { examSession: true, student: true },
  });
  if (studentClash) {
    return NextResponse.json(
      {
        error: `Conflit : ${studentClash.student.firstname} ${studentClash.student.lastname} est déjà placé sur la session « ${studentClash.examSession.title} » aux mêmes dates.`,
      },
      { status: 409 },
    );
  }

  // EXAM-002: a room cannot host two exams at the same time
  const roomClash = await prisma.examRoomAllocation.findFirst({
    where: {
      examSessionId: { not: examSessionId },
      classroomId: { in: parsed.data.classroomIds },
      examSession: {
        startDate: { lt: session.endDate },
        endDate: { gt: session.startDate },
      },
    },
    include: { classroom: true, examSession: true },
  });
  if (roomClash) {
    return NextResponse.json(
      {
        error: `Conflit de salle : la salle ${roomClash.classroom.name} est déjà utilisée par la session « ${roomClash.examSession.title} » sur ces dates.`,
      },
      { status: 409 },
    );
  }

  let plan: SeatingAllocation[];
  try {
    plan = buildSeatingPlan(
      students.map((student) => ({
        studentId: student.studentId,
        classId: student.classId,
      })),
      classrooms.map((room) => ({
        classroomId: room.classroomId,
        capacity: room.capacity ?? 0,
      })),
      session.distributionType === "MIXED",
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Allocation failed" },
      { status: 409 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.examRoomAllocation.deleteMany({ where: { examSessionId } });
    await tx.examRoomAllocation.createMany({
      data: plan.map((seat) => ({ examSessionId, ...seat })),
    });
    for (const seat of plan) {
      const student = students.find(
        (item) => item.studentId === seat.studentId,
      );
      const room = classrooms.find(
        (item) => item.classroomId === seat.classroomId,
      );
      if (!student || !room) continue;
      const recipientIds = new Set<number>();
      if (student.userId) recipientIds.add(student.userId);
      for (const link of student.guardians)
        recipientIds.add(link.guardian.userId);
      if (recipientIds.size === 0) continue;
      await tx.notification.create({
        data: {
          title: `Salle d'examen — ${session.title}`,
          message: `${student.firstname} ${student.lastname} est affecté(e) à la salle ${room.name}, place ${seat.seatNumber}.`,
          type: "EXAM_ROOM",
          audience: "USER",
          recipients: {
            create: [...recipientIds].map((userId) => ({ userId })),
          },
        },
      });
    }
  });

  return NextResponse.json({
    message: "Seating plan generated",
    allocations: plan.length,
  });
}
