import { RsvpStatus } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  response: z.nativeEnum(RsvpStatus).refine((value) => value !== "PENDING"),
});
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(req);
  const eventId = Number((await params).id);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!user || !Number.isInteger(eventId) || !parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    const recipient = await prisma.eventRecipient.update({
      where: { eventId_userId: { eventId, userId: user.userId } },
      data: { response: parsed.data.response, respondedAt: new Date() },
    });
    return NextResponse.json(recipient);
  } catch {
    return NextResponse.json(
      { error: "Invitation not found" },
      { status: 404 },
    );
  }
}
