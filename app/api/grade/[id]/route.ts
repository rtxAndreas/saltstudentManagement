import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    const { id } = await params;
    const gradeId = Number(id);

    if (Number.isNaN(gradeId)) {
      return NextResponse.json({ error: "Invalid grade ID" }, { status: 400 });
    }

    const grade = await prisma.grade.findUnique({
      where: { gradeId },
      include: {
        student: true,
        period: true,
        assignment: true,
        createdBy: { select: { userId: true, name: true, lastname: true } },
      },
    });

    if (!grade) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    return NextResponse.json(grade);
  } catch (error) {
    console.error("GET /api/grade/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    const { id } = await params;
    const gradeId = Number(id);

    if (Number.isNaN(gradeId)) {
      return NextResponse.json({ error: "Invalid grade ID" }, { status: 400 });
    }

    await prisma.grade.delete({ where: { gradeId } });

    return NextResponse.json({ message: "Grade deleted successfully" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Grade not found" }, { status: 404 });
      }
    }
    console.error("DELETE /api/grade/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
