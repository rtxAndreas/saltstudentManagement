import { PaymentMethod, Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth";
import { verifyAccountingAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  invoiceId: z.number().int().positive(),
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  const accessError = await verifyAccountingAccess(req);
  if (accessError) return accessError;
  return NextResponse.json(
    await prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      include: {
        invoice: true,
        receipt: true,
        receivedBy: { select: { name: true, lastname: true } },
      },
    }),
  );
}

export async function POST(req: NextRequest) {
  const accessError = await verifyAccountingAccess(req);
  if (accessError) return accessError;
  const user = await getUserFromRequest(req);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!user || !parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.studentInvoice.findUnique({
        where: { invoiceId: parsed.data.invoiceId },
      });
      if (!invoice || invoice.status === "CANCELLED")
        throw new Error("INVOICE_NOT_FOUND");
      const amount = new Prisma.Decimal(parsed.data.amount);
      const balance = invoice.totalAmount.minus(invoice.paidAmount);
      if (amount.greaterThan(balance))
        throw new Error("AMOUNT_EXCEEDS_BALANCE");
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.invoiceId,
          amount,
          method: parsed.data.method,
          reference: parsed.data.reference || null,
          receivedById: user.userId,
        },
      });
      const newPaidAmount = invoice.paidAmount.plus(amount);
      const updatedInvoice = await tx.studentInvoice.update({
        where: { invoiceId: invoice.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newPaidAmount.equals(invoice.totalAmount)
            ? "PAID"
            : "PARTIALLY_PAID",
        },
      });
      const receipt = await tx.receipt.create({
        data: {
          paymentId: payment.paymentId,
          number: `REC-${new Date().getFullYear()}-${String(payment.paymentId).padStart(6, "0")}`,
        },
      });
      const enrollment = await tx.enrollment.findUnique({
        where: { enrollmentId: invoice.enrollmentId },
        include: {
          student: { include: { guardians: { include: { guardian: true } } } },
        },
      });
      if (enrollment) {
        const recipientIds = new Set<number>();
        if (enrollment.student.userId)
          recipientIds.add(enrollment.student.userId);
        for (const link of enrollment.student.guardians)
          recipientIds.add(link.guardian.userId);
        if (recipientIds.size) {
          await tx.notification.create({
            data: {
              title: "Paiement d’écolage reçu",
              message: `Paiement de ${amount.toString()} enregistré. Reçu ${receipt.number}. Solde restant : ${invoice.totalAmount.minus(newPaidAmount).toString()}.`,
              type: "PAYMENT",
              audience: "USER",
              createdById: user.userId,
              recipients: {
                create: [...recipientIds].map((userId) => ({ userId })),
              },
            },
          });
        }
      }
      return { payment, receipt, invoice: updatedInvoice };
    });
    return NextResponse.json(
      { message: "Payment recorded", ...result },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INVOICE_NOT_FOUND")
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (error instanceof Error && error.message === "AMOUNT_EXCEEDS_BALANCE")
      return NextResponse.json(
        { error: "Payment exceeds remaining balance" },
        { status: 409 },
      );
    throw error;
  }
}
