import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const readSchema = z.object({ notificationId: z.number().int().positive() });

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const notifications = await prisma.notificationRecipient.findMany({
    where: { userId: user.userId },
    orderBy: { notification: { publishedAt: "desc" } },
    include: { notification: true },
  });
  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const parsed = readSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    const recipient = await prisma.notificationRecipient.update({
      where: {
        notificationId_userId: {
          notificationId: parsed.data.notificationId,
          userId: user.userId,
        },
      },
      data: { readAt: new Date() },
    });
    return NextResponse.json(recipient);
  } catch {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }
}
