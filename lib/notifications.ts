import type { Prisma } from "@prisma/client";

type TransactionClient = Prisma.TransactionClient;

export async function getClassRecipientIds(
  tx: TransactionClient,
  classId: number,
) {
  const students = await tx.student.findMany({
    where: { classId, status: "ACTIVE" },
    select: {
      userId: true,
      guardians: { select: { guardian: { select: { userId: true } } } },
    },
  });
  const ids = new Set<number>();
  for (const student of students) {
    if (student.userId) ids.add(student.userId);
    for (const link of student.guardians) ids.add(link.guardian.userId);
  }
  return [...ids];
}
