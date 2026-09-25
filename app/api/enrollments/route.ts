import { type NextRequest, NextResponse } from "next/server";
import { verifyAccountingAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const accessError = await verifyAccountingAccess(req);
  if (accessError) return accessError;
  const enrollments = await prisma.enrollment.findMany({
    where: { status: "ACTIVE" },
    orderBy: [
      { schoolYear: { startDate: "desc" } },
      { student: { lastname: "asc" } },
    ],
    include: { student: true, class: true, schoolYear: true },
  });
  return NextResponse.json(enrollments);
}
