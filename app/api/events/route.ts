import { Role, SchoolEventType } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/guards";
import { getClassRecipientIds } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    title: z.string().trim().min(2),
    description: z.string().trim().optional(),
    type: z.nativeEnum(SchoolEventType),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    location: z.string().trim().optional(),
    schoolYearId: z.number().int().positive(),
    classId: z.number().int().positive().nullable().optional(),
    targetRole: z.nativeEnum(Role).nullable().optional(),
    requiresConfirmation: z.boolean().default(false),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    path: ["endsAt"],
    message: "End time must be after start time",
  });

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (
    !user ||
    !["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "ACCOUNTANT"].includes(user.role)
  )
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  return NextResponse.json(
    await prisma.schoolEvent.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        schoolYear: true,
        class: true,
        createdBy: { select: { name: true, lastname: true } },
        _count: { select: { recipients: true } },
      },
    }),
  );
}

export async function POST(req: NextRequest) {
  const accessError = await verifyAdminAccess(req);
  if (accessError) return accessError;
  const user = await getUserFromRequest(req);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!user || !parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.success
          ? undefined
          : parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  const [schoolYear, targetClass] = await Promise.all([
    prisma.schoolYear.findUnique({
      where: { schoolYearId: parsed.data.schoolYearId },
    }),
    parsed.data.classId
      ? prisma.class.findUnique({ where: { classId: parsed.data.classId } })
      : null,
  ]);
  if (!schoolYear)
    return NextResponse.json(
      { error: "School year not found" },
      { status: 404 },
    );
  if (parsed.data.classId && !targetClass)
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  if (targetClass && targetClass.schoolYearId !== parsed.data.schoolYearId) {
    return NextResponse.json(
      { error: "Class and event must belong to the same school year" },
      { status: 409 },
    );
  }
  const result = await prisma.$transaction(async (tx) => {
    let recipientIds: number[];
    if (parsed.data.classId)
      recipientIds = await getClassRecipientIds(tx, parsed.data.classId);
    else if (parsed.data.targetRole)
      recipientIds = (
        await tx.user.findMany({
          where: { role: parsed.data.targetRole, status: "ACTIVE" },
          select: { userId: true },
        })
      ).map((item) => item.userId);
    else
      recipientIds = (
        await tx.user.findMany({
          where: { status: "ACTIVE" },
          select: { userId: true },
        })
      ).map((item) => item.userId);
    const event = await tx.schoolEvent.create({
      data: {
        ...parsed.data,
        description: parsed.data.description || null,
        location: parsed.data.location || null,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: new Date(parsed.data.endsAt),
        createdById: user.userId,
        recipients: {
          create: [...new Set(recipientIds)].map((userId) => ({ userId })),
        },
      },
    });
    if (recipientIds.length)
      await tx.notification.create({
        data: {
          title: parsed.data.title,
          message: `${parsed.data.type === "CONFERENCE" ? "Conférence" : "Événement"} le ${new Date(parsed.data.startsAt).toLocaleString("fr-FR")}${parsed.data.location ? ` à ${parsed.data.location}` : ""}.`,
          type: "CONFERENCE",
          audience: parsed.data.classId
            ? "CLASS"
            : parsed.data.targetRole
              ? "ROLE"
              : "SCHOOL",
          classId: parsed.data.classId || null,
          roleTarget: parsed.data.targetRole || null,
          createdById: user.userId,
          recipients: {
            create: [...new Set(recipientIds)].map((userId) => ({ userId })),
          },
        },
      });
    return event;
  });
  return NextResponse.json(
    { message: "Event published", event: result },
    { status: 201 },
  );
}
