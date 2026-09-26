import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess, verifyUserAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessError = await verifyUserAccess(req);
  if (accessError) return accessError;
  const examSessionId = Number((await params).id);
  if (!Number.isInteger(examSessionId)) {
    return NextResponse.json(
      { error: "Invalid exam session ID" },
      { status: 400 },
    );
  }
  const session = await prisma.examSession.findUnique({
    where: { examSessionId },
    include: {
      schoolYear: true,
      allocations: {
        orderBy: [{ classroomId: "asc" }, { seatNumber: "asc" }],
        include: { student: { include: { class: true } }, classroom: true },
      },
      slots: {
        orderBy: { startsAt: "asc" },
        include: {
          assignment: { include: { course: true, class: true } },
          duties: { include: { classroom: true, invigilator: true } },
        },
      },
    },
  });
  if (!session)
    return NextResponse.json(
      { error: "Exam session not found" },
      { status: 404 },
    );
  return NextResponse.json(session);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessError = await verifyAdminAccess(req);
  if (accessError) return accessError;
  const examSessionId = Number((await params).id);
  if (!Number.isInteger(examSessionId)) {
    return NextResponse.json(
      { error: "Invalid exam session ID" },
      { status: 400 },
    );
  }
  await prisma.examSession.delete({ where: { examSessionId } });
  return NextResponse.json({ message: "Exam session deleted" });
}
