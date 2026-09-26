import { type NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getStudentPortalData } from "@/lib/portal";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !["STUDENT", "PARENT"].includes(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  const notifications = await prisma.notificationRecipient.findMany({
    where: { userId: user.userId },
    orderBy: { notification: { publishedAt: "desc" } },
    take: 30,
    include: { notification: true },
  });
  const events = await prisma.eventRecipient.findMany({
    where: { userId: user.userId, event: { endsAt: { gte: new Date() } } },
    orderBy: { event: { startsAt: "asc" } },
    include: { event: true },
  });
  if (user.role === "STUDENT") {
    const profile = await prisma.student.findUnique({
      where: { userId: user.userId },
    });
    if (!profile)
      return NextResponse.json(
        { error: "Student account is not linked" },
        { status: 409 },
      );
    return NextResponse.json({
      role: user.role,
      children: [await getStudentPortalData(profile.studentId)],
      notifications,
      events,
    });
  }
  const guardian = await prisma.guardian.findUnique({
    where: { userId: user.userId },
    include: { students: { orderBy: { isPrimary: "desc" } } },
  });
  if (!guardian)
    return NextResponse.json(
      { error: "Parent account is not linked" },
      { status: 409 },
    );
  const requestedId = Number(new URL(req.url).searchParams.get("studentId"));
  const allowedIds = guardian.students.map((item) => item.studentId);
  if (Number.isInteger(requestedId) && !allowedIds.includes(requestedId)) {
    // CDC 2.5: a parent may only consult children linked to their account
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  const selectedIds = Number.isInteger(requestedId)
    ? [requestedId]
    : allowedIds;
  const children = await Promise.all(selectedIds.map(getStudentPortalData));
  return NextResponse.json({
    role: user.role,
    children,
    notifications,
    events,
  });
}
