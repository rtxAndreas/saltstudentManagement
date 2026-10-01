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
    const period = await prisma.period.findUnique({
      where: { periodId: Number(id) },
      include: {
        schoolYear: true,
      },
    });

    if (!period) {
      return NextResponse.json({ error: "Period not found" }, { status: 404 });
    }
    return NextResponse.json(period);
  } catch (error) {
    console.error("GET /api/period/[id] error:", error);
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
    const period = await prisma.period.findUnique({
      where: { periodId: Number(id) },
    });

    if (!period) {
      return NextResponse.json({ error: "Period not found" }, { status: 404 });
    }
    return NextResponse.json(period);
  } catch (error) {
    console.error("PUT /api/period/[id] error:", error);
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
    const periodId = Number(id);

    if (Number.isNaN(periodId)) {
      return NextResponse.json({ error: "Invalid period ID" }, { status: 400 });
    }

    await prisma.period.delete({
      where: { periodId },
    });

    return NextResponse.json({ message: "Period deleted successfully" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Period not found" },
          { status: 404 },
        );
      }
    }
    console.error("DELETE /api/period/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
