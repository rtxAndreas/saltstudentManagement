import { Role, Status } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { verifyUserAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const accessError = await verifyUserAccess(req);
  if (accessError) return accessError;

  const searchParams = new URL(req.url).searchParams;
  const schoolYearId = Number(searchParams.get("schoolYearId"));
  const periodId = Number(searchParams.get("periodId"));

  if (!Number.isInteger(schoolYearId) || schoolYearId <= 0) {
    return NextResponse.json(
      { error: "schoolYearId is required" },
      { status: 400 },
    );
  }

  try {
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { schoolYearId },
      select: { schoolYearId: true, label: true },
    });
    if (!schoolYear)
      return NextResponse.json(
        { error: "School year not found" },
        { status: 404 },
      );

    const periods = await prisma.period.findMany({
      where: { schoolYearId },
      orderBy: { startDate: "asc" },
      select: { periodId: true, label: true },
    });
    if (periodId && !periods.some((period) => period.periodId === periodId)) {
      return NextResponse.json(
        { error: "Period does not belong to school year" },
        { status: 400 },
      );
    }

    const students = await prisma.student.findMany({
      where: { status: Status.ACTIVE, class: { schoolYearId } },
      select: {
        gender: true,
        class: { select: { classId: true, name: true } },
      },
    });
    const classMap = new Map<
      number,
      { classId: number; className: string; count: number }
    >();
    for (const student of students) {
      const current = classMap.get(student.class.classId) ?? {
        classId: student.class.classId,
        className: student.class.name,
        count: 0,
      };
      current.count += 1;
      classMap.set(student.class.classId, current);
    }

    const [totalTeachers, totalClasses] = await Promise.all([
      prisma.user.count({
        where: { role: Role.INSTRUCTOR, status: Status.ACTIVE },
      }),
      prisma.class.count({ where: { schoolYearId } }),
    ]);

    const grades = await prisma.grade.findMany({
      where: {
        student: { status: Status.ACTIVE, class: { schoolYearId } },
        period: { schoolYearId },
      },
      distinct: ["studentId", "periodId"],
      select: { studentId: true, periodId: true },
    });
    const evaluatedByPeriod = periods.map((period) => ({
      periodId: period.periodId,
      label: period.label,
      evaluated: grades.filter((grade) => grade.periodId === period.periodId)
        .length,
    }));

    const attendanceByStatus = await prisma.attendance.groupBy({
      by: ["status"],
      where: { schedule: { schoolYearId } },
      _count: { _all: true },
    });
    const attendanceTotal = attendanceByStatus.reduce(
      (sum, row) => sum + row._count._all,
      0,
    );
    const attendanceCount = (status: string) =>
      attendanceByStatus.find((row) => row.status === status)?._count._all ?? 0;
    const attendance = {
      present: attendanceCount("PRESENT"),
      absent: attendanceCount("ABSENT"),
      late: attendanceCount("LATE"),
      excused: attendanceCount("EXCUSED"),
      total: attendanceTotal,
      rate:
        attendanceTotal > 0
          ? ((attendanceCount("PRESENT") +
              attendanceCount("LATE") +
              attendanceCount("EXCUSED")) /
              attendanceTotal) *
            100
          : 0,
    };

    const invoiceAgg = await prisma.studentInvoice.aggregate({
      where: { enrollment: { schoolYearId } },
      _sum: { totalAmount: true, paidAmount: true },
    });
    const billed = Number(invoiceAgg._sum.totalAmount ?? 0);
    const paid = Number(invoiceAgg._sum.paidAmount ?? 0);
    const invoiceStatuses = await prisma.studentInvoice.groupBy({
      by: ["status"],
      where: { enrollment: { schoolYearId } },
      _count: { _all: true },
    });
    const invoiceCount = (status: string) =>
      invoiceStatuses.find((row) => row.status === status)?._count._all ?? 0;

    const now = new Date();
    const [upcomingAssessments, upcomingExamSlots, upcomingEvents] =
      await Promise.all([
        prisma.assessment.findMany({
          where: { scheduledAt: { gte: now }, period: { schoolYearId } },
          orderBy: { scheduledAt: "asc" },
          take: 5,
          select: {
            assessmentId: true,
            title: true,
            type: true,
            scheduledAt: true,
            assignment: {
              select: { course: { select: { name: true, code: true } } },
            },
            period: { select: { label: true } },
          },
        }),
        prisma.examSlot.findMany({
          where: { startsAt: { gte: now }, examSession: { schoolYearId } },
          orderBy: { startsAt: "asc" },
          take: 5,
          select: {
            examSlotId: true,
            startsAt: true,
            endsAt: true,
            examSession: { select: { title: true } },
            assignment: {
              select: {
                course: { select: { name: true, code: true } },
                class: { select: { name: true } },
              },
            },
          },
        }),
        prisma.schoolEvent.findMany({
          where: { schoolYearId, startsAt: { gte: now } },
          orderBy: { startsAt: "asc" },
          take: 5,
          select: {
            eventId: true,
            title: true,
            type: true,
            startsAt: true,
            endsAt: true,
            location: true,
            requiresConfirmation: true,
          },
        }),
      ]);

    return NextResponse.json({
      schoolYear,
      selectedPeriodId: periodId || null,
      totalStudents: students.length,
      totalClasses,
      totalTeachers,
      gender: {
        boys: students.filter((student) => student.gender === "MALE").length,
        girls: students.filter((student) => student.gender === "FEMALE").length,
      },
      byClass: [...classMap.values()].sort((a, b) =>
        a.className.localeCompare(b.className),
      ),
      evaluatedByPeriod,
      attendance,
      finance: {
        billed,
        paid,
        remaining: Math.max(billed - paid, 0),
        rate: billed > 0 ? (paid / billed) * 100 : 0,
        paidInvoices: invoiceCount("PAID"),
        overdueInvoices: invoiceCount("OVERDUE"),
      },
      upcomingAssessments,
      upcomingExamSlots,
      upcomingEvents,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
