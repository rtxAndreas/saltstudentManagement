import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAccountingAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  enrollmentId: z.number().int().positive(),
  label: z.string().trim().min(2),
  totalAmount: z.number().positive(),
  dueDate: z.string().datetime(),
});

export async function GET(req: NextRequest) {
  const accessError = await verifyAccountingAccess(req);
  if (accessError) return accessError;
  return NextResponse.json(
    await prisma.studentInvoice.findMany({
      orderBy: { dueDate: "desc" },
      include: {
        enrollment: {
          include: { student: true, class: true, schoolYear: true },
        },
        payments: true,
      },
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
  const enrollment = await prisma.enrollment.findUnique({
    where: { enrollmentId: parsed.data.enrollmentId },
  });
  if (!enrollment)
    return NextResponse.json(
      { error: "Enrollment not found" },
      { status: 404 },
    );
  const reference = `INV-${enrollment.schoolYearId}-${enrollment.studentId}-${Date.now()}`;
  const invoice = await prisma.studentInvoice.create({
    data: {
      enrollmentId: enrollment.enrollmentId,
      reference,
      label: parsed.data.label,
      totalAmount: new Prisma.Decimal(parsed.data.totalAmount),
      dueDate: new Date(parsed.data.dueDate),
    },
  });
  return NextResponse.json(
    { message: "Invoice issued", invoice },
    { status: 201 },
  );
}
