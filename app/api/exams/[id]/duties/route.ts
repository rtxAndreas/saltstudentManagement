import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  examSlotId: z.number().int().positive(),
  classroomId: z.number().int().positive(),
  invigilatorId: z.number().int().positive(),
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
  const { examSlotId, classroomId, invigilatorId } = parsed.data;
  const [slot, room, invigilator] = await Promise.all([
    prisma.examSlot.findUnique({ where: { examSlotId } }),
    prisma.classroom.findUnique({ where: { classroomId } }),
    prisma.user.findUnique({ where: { userId: invigilatorId } }),
  ]);
  if (!slot || slot.examSessionId !== examSessionId || !room || !invigilator) {
    return NextResponse.json(
      { error: "Slot, room or invigilator not found" },
      { status: 404 },
    );
  }
  if (!["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(invigilator.role)) {
    return NextResponse.json(
      { error: "This user cannot supervise an exam" },
      { status: 400 },
    );
  }

  const overlappingDuty = await prisma.examInvigilatorAssignment.findFirst({
    where: {
      invigilatorId,
      examSlot: {
        startsAt: { lt: slot.endsAt },
        endsAt: { gt: slot.startsAt },
      },
    },
  });
  if (overlappingDuty) {
    return NextResponse.json(
      { error: "Invigilator already has a duty at this time" },
      { status: 409 },
    );
  }
  const repeatedRoom = await prisma.examInvigilatorAssignment.findFirst({
    where: { invigilatorId, classroomId, examSlot: { examSessionId } },
  });
  if (repeatedRoom) {
    return NextResponse.json(
      {
        error:
          "Invigilator rotation required: this person already supervised this room during the session",
      },
      { status: 409 },
    );
  }
  const duty = await prisma.examInvigilatorAssignment.create({
    data: { examSlotId, classroomId, invigilatorId },
  });
  return NextResponse.json(
    { message: "Invigilator assigned", duty },
    { status: 201 },
  );
}
