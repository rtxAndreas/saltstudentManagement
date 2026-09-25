"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiCalendar,
  FiCheckSquare,
  FiCreditCard,
  FiEdit2,
  FiHash,
  FiPlus,
  FiTag,
  FiUser,
} from "react-icons/fi";
import {
  CancelButton,
  SelectField,
  SubmitButton,
  TextField,
} from "@/app/components/ui/FormField";
import { Modal } from "@/app/components/ui/Modal";
import { useUser } from "@/app/context/userContext";

type Enrollment = {
  enrollmentId: number;
  student: {
    firstname: string;
    lastname: string;
    registrationNumber: string | null;
  };
  class: { name: string };
  schoolYear: { label: string };
};
type Invoice = {
  invoiceId: number;
  reference: string;
  label: string;
  totalAmount: string;
  paidAmount: string;
  dueDate: string;
  status: string;
  enrollment: Enrollment;
};
type Payment = {
  paymentId: number;
  amount: string;
  method: string;
  paidAt: string;
  cancelledAt: string | null;
  invoice: { reference: string };
  receipt: { number: string } | null;
};

async function json<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? data.message ?? "Opération impossible");
  return data;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Espèces" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "BANK_TRANSFER", label: "Virement" },
  { value: "CARD", label: "Carte" },
  { value: "CHEQUE", label: "Chèque" },
  { value: "OTHER", label: "Autre" },
];

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-green-50 text-green-700 border-green-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-slate-50 text-slate-600 border-slate-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function FinancePage() {
  const { isStudent, isParent, isLoading: userLoading } = useUser();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState<"invoice" | "payment" | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    enrollmentId: "",
    label: "Écolage",
    totalAmount: "",
    dueDate: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "",
    amount: "",
    method: "CASH",
    reference: "",
  });

  const load = useCallback(async () => {
    try {
      const [e, i, p] = await Promise.all([
        json<Enrollment[]>(await fetch("/api/enrollments")),
        json<Invoice[]>(await fetch("/api/invoices")),
        json<Payment[]>(await fetch("/api/payments")),
      ]);
      setEnrollments(e);
      setInvoices(i);
      setPayments(p);
      setInvoiceForm((f) => ({
        ...f,
        enrollmentId: f.enrollmentId || String(e[0]?.enrollmentId ?? ""),
      }));
      setPaymentForm((f) => ({
        ...f,
        invoiceId:
          f.invoiceId ||
          String(
            i.find((x) => !["PAID", "CANCELLED"].includes(x.status))
              ?.invoiceId ?? "",
          ),
      }));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Chargement impossible",
      );
    }
  }, []);

  // Initial data loading synchronizes the page with the API once on mount,
  // except for students/parents who only have a portal view of their own fees.
  useEffect(() => {
    if (userLoading) return;
    if (isStudent || isParent) {
      window.location.href = "/portal";
      return;
    }
    void load();
  }, [userLoading, isStudent, isParent, load]);

  const close = () => {
    setDialog(null);
    setError("");
  };

  const issueInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await json(
        await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollmentId: Number(invoiceForm.enrollmentId),
            label: invoiceForm.label,
            totalAmount: Number(invoiceForm.totalAmount),
            dueDate: new Date(invoiceForm.dueDate).toISOString(),
          }),
        }),
      );
      setMessage("Facture créée.");
      setInvoiceForm((f) => ({ ...f, totalAmount: "", dueDate: "" }));
      setDialog(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const recordPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await json<{ receipt: { number: string } }>(
        await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: Number(paymentForm.invoiceId),
            amount: Number(paymentForm.amount),
            method: paymentForm.method,
            reference: paymentForm.reference || undefined,
          }),
        }),
      );
      setMessage(`Paiement enregistré. Reçu ${result.receipt.number}`);
      setPaymentForm((f) => ({ ...f, amount: "", reference: "" }));
      setDialog(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const totalBilled = invoices.reduce(
    (sum, item) => sum + Number(item.totalAmount),
    0,
  );
  const totalPaid = invoices.reduce(
    (sum, item) => sum + Number(item.paidAmount),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-3 text-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Écolage et paiements</h1>
          <p className="text-gray-600">
            Facturation, encaissements partiels, soldes et reçus.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDialog("invoice")}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800"
          >
            <FiPlus /> Créer une facture
          </button>
          <button
            type="button"
            onClick={() => setDialog("payment")}
            className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
          >
            <FiCreditCard /> Enregistrer un paiement
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-green-50 p-3 text-green-800">
          {message}
        </div>
      )}
      {error && !dialog && (
        <div className="rounded-xl bg-red-50 p-3 text-red-800">{error}</div>
      )}

      <Modal
        open={dialog === "invoice"}
        onClose={close}
        label="Créer une facture"
        title="Créer une facture"
        icon={
          <span className="rounded-xl bg-gray-900 p-2.5 text-white">
            <FiEdit2 />
          </span>
        }
        maxWidth="max-w-xl"
      >
        <form onSubmit={issueInvoice} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <SelectField
            id="invoice-enrollment"
            label="Élève"
            icon={<FiUser />}
            required
            value={invoiceForm.enrollmentId}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, enrollmentId: e.target.value })
            }
          >
            {enrollments.map((item) => (
              <option key={item.enrollmentId} value={item.enrollmentId}>
                {item.student.firstname} {item.student.lastname} ·{" "}
                {item.class.name} · {item.schoolYear.label}
              </option>
            ))}
          </SelectField>

          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              id="invoice-label"
              label="Libellé"
              icon={<FiTag />}
              required
              value={invoiceForm.label}
              onChange={(e) =>
                setInvoiceForm({ ...invoiceForm, label: e.target.value })
              }
            />
            <TextField
              id="invoice-amount"
              label="Montant"
              icon={<FiHash />}
              type="number"
              min="1"
              required
              placeholder="50000"
              value={invoiceForm.totalAmount}
              onChange={(e) =>
                setInvoiceForm({ ...invoiceForm, totalAmount: e.target.value })
              }
            />
          </div>

          <TextField
            id="invoice-due"
            label="Échéance"
            icon={<FiCalendar />}
            type="date"
            required
            value={invoiceForm.dueDate}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
            }
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <CancelButton onClick={close} />
            <SubmitButton
              loading={submitting}
              loadingLabel="Émission..."
              className="flex-1"
            >
              Émettre la facture
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog === "payment"}
        onClose={close}
        label="Enregistrer un paiement"
        title="Enregistrer un paiement"
        icon={
          <span className="rounded-xl bg-gray-900 p-2.5 text-white">
            <FiCreditCard />
          </span>
        }
        maxWidth="max-w-xl"
      >
        <form onSubmit={recordPayment} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <SelectField
            id="payment-invoice"
            label="Facture"
            icon={<FiTag />}
            required
            value={paymentForm.invoiceId}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, invoiceId: e.target.value })
            }
          >
            {invoices
              .filter((item) => !["PAID", "CANCELLED"].includes(item.status))
              .map((item) => (
                <option key={item.invoiceId} value={item.invoiceId}>
                  {item.reference} · {item.enrollment.student.firstname}{" "}
                  {item.enrollment.student.lastname} · reste{" "}
                  {(
                    Number(item.totalAmount) - Number(item.paidAmount)
                  ).toLocaleString("fr-FR")}
                </option>
              ))}
          </SelectField>

          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              id="payment-amount"
              label="Montant reçu"
              icon={<FiHash />}
              type="number"
              min="1"
              required
              placeholder="25000"
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, amount: e.target.value })
              }
            />
            <SelectField
              id="payment-method"
              label="Moyen de paiement"
              icon={<FiCreditCard />}
              value={paymentForm.method}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, method: e.target.value })
              }
            >
              {PAYMENT_METHODS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectField>
          </div>

          <TextField
            id="payment-reference"
            label="Référence externe"
            icon={<FiHash />}
            hint="Facultatif"
            placeholder="N° de transaction"
            value={paymentForm.reference}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, reference: e.target.value })
            }
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <CancelButton onClick={close} />
            <SubmitButton
              loading={submitting}
              loadingLabel="Validation..."
              className="flex-1"
            >
              <FiCheckSquare /> Valider et créer le reçu
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="Facturé" value={totalBilled} />
        <Card label="Encaissé" value={totalPaid} />
        <Card label="Reste à payer" value={totalBilled - totalPaid} />
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Factures</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr>
                <th className="p-2">Référence</th>
                <th>Élève</th>
                <th>Libellé</th>
                <th>Total</th>
                <th>Payé</th>
                <th>Reste</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((item) => (
                <tr className="border-t" key={item.invoiceId}>
                  <td className="p-2 font-mono">{item.reference}</td>
                  <td>
                    {item.enrollment.student.firstname}{" "}
                    {item.enrollment.student.lastname}
                  </td>
                  <td>{item.label}</td>
                  <td>{Number(item.totalAmount).toLocaleString("fr-FR")}</td>
                  <td>{Number(item.paidAmount).toLocaleString("fr-FR")}</td>
                  <td>
                    {(
                      Number(item.totalAmount) - Number(item.paidAmount)
                    ).toLocaleString("fr-FR")}
                  </td>
                  <td>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[item.status] ?? STATUS_STYLE.PENDING}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Derniers paiements</h2>
        {payments.map((item) => (
          <div
            className="flex flex-wrap justify-between border-b p-3"
            key={item.paymentId}
          >
            <span>
              {item.invoice.reference} · {item.method}
            </span>
            <b>
              {Number(item.amount).toLocaleString("fr-FR")} ·{" "}
              {item.receipt?.number}
            </b>
          </div>
        ))}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value.toLocaleString("fr-FR")}</p>
    </div>
  );
}
