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
    const assignmentId = Number(id);

    if (Number.isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 },
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: { assignmentId },
      include: {
        teacher: { select: { userId: true, name: true, lastname: true } },
        class: true,
        course: true,
        schoolYear: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("GET /api/assignment/[id] error:", error);
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
    const assignmentId = Number(id);

    if (Number.isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 },
      );
    }

    await prisma.assignment.delete({ where: { assignmentId } });

    return NextResponse.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Assignment not found" },
          { status: 404 },
        );
      }
    }
    console.error("DELETE /api/assignment/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
