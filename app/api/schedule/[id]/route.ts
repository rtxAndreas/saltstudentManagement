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
    const scheduleId = Number(id);

    if (Number.isNaN(scheduleId)) {
      return NextResponse.json(
        { error: "Invalid schedule ID" },
        { status: 400 },
      );
    }

    await prisma.schedule.delete({
      where: { scheduleId },
    });

    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Schedule not found" },
          { status: 404 },
        );
      }
    }
    console.error("DELETE /api/schedule/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
