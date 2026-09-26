import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess, verifyUserAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const schoolSettingsSchema = z.object({
  schoolName: z.string().min(1, "School name is required").optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  logoUrl: z.string().optional(),
});

const SETTINGS_ID = 1;

async function getOrCreateSettings() {
  const existing = await prisma.schoolSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (existing) return existing;
  return prisma.schoolSettings.create({
    data: { id: SETTINGS_ID, schoolName: "" },
  });
}

export async function GET(req: NextRequest) {
  try {
    const accessError = await verifyUserAccess(req);
    if (accessError) return accessError;

    const settings = await getOrCreateSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/schoolSettings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = schoolSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const existing = await prisma.schoolSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Settings already exist. Use PUT to update." },
        { status: 409 },
      );
    }

    const settings = await prisma.schoolSettings.create({
      data: {
        schoolName: parsed.data.schoolName ?? "",
        address: parsed.data.address ?? null,
        phone: parsed.data.phone ?? null,
        email: parsed.data.email ?? null,
        logoUrl: parsed.data.logoUrl ?? null,
      },
    });

    return NextResponse.json(
      { message: "Settings created successfully", settings },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/schoolSettings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = schoolSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const settings = await prisma.schoolSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        schoolName: parsed.data.schoolName ?? "",
        address: parsed.data.address ?? null,
        phone: parsed.data.phone ?? null,
        email: parsed.data.email ?? null,
        logoUrl: parsed.data.logoUrl ?? null,
      },
      update: {
        ...(parsed.data.schoolName !== undefined && {
          schoolName: parsed.data.schoolName,
        }),
        ...(parsed.data.address !== undefined && {
          address: parsed.data.address,
        }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email }),
        ...(parsed.data.logoUrl !== undefined && {
          logoUrl: parsed.data.logoUrl,
        }),
      },
    });

    return NextResponse.json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("PUT /api/schoolSettings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
