import { FeeFrequency, Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAccountingAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  schoolYearId: z.number().int().positive(),
  classId: z.number().int().positive().nullable().optional(),
  label: z.string().trim().min(2),
  amount: z.number().positive(),
  frequency: z.nativeEnum(FeeFrequency),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const accessError = await verifyAccountingAccess(req);
  if (accessError) return accessError;
  return NextResponse.json(
    await prisma.feeStructure.findMany({
      orderBy: { createdAt: "desc" },
      include: { schoolYear: true, class: true },
    }),
  );
}

export async function POST(req: NextRequest) {
  const accessError = await verifyAccountingAccess(req);
  if (accessError) return accessError;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
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
      { error: "Class and fee structure must belong to the same school year" },
      { status: 409 },
    );
  }
  const fee = await prisma.feeStructure.create({
    data: { ...parsed.data, amount: new Prisma.Decimal(parsed.data.amount) },
  });
  return NextResponse.json(
    { message: "Fee structure created", fee },
    { status: 201 },
  );
}
