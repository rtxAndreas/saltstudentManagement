import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    const { id } = await params;
    const classroomId = Number(id);

    if (Number.isNaN(classroomId)) {
      return NextResponse.json(
        { error: "Invalid classroom ID" },
        { status: 400 },
      );
    }

    await prisma.classroom.delete({
      where: { classroomId },
    });

    return NextResponse.json({ message: "Classroom deleted successfully" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Classroom not found" },
          { status: 404 },
        );
      }
    }
    console.error("DELETE /api/classroom/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
