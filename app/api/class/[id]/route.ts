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
    const classId = Number(id);

    if (Number.isNaN(classId)) {
      return NextResponse.json({ error: "Invalid class ID" }, { status: 400 });
    }

    const classItem = await prisma.class.findUnique({
      where: { classId },
      include: {
        schoolYear: true,
      },
    });

    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    return NextResponse.json(classItem);
  } catch (error) {
    console.error("GET /api/class/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;
    const { id } = await params;
    const classId = Number(id);

    if (Number.isNaN(classId)) {
      return NextResponse.json({ error: "Invalid class ID" }, { status: 400 });
    }

    const classItem = await prisma.class.findUnique({
      where: { classId },
    });

    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    return NextResponse.json(classItem);
  } catch (error) {
    console.error("PUT /api/class/[id] error:", error);
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
    const classId = Number(id);

    if (Number.isNaN(classId)) {
      return NextResponse.json({ error: "Invalid class ID" }, { status: 400 });
    }

    await prisma.class.delete({
      where: { classId },
    });

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }
    }
    console.error("DELETE /api/class/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
