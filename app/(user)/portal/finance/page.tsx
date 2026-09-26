"use client";

import { PortalTitle, usePortal } from "../_components/PortalProvider";
import { invoiceStatusLabels } from "../_types";

export default function PortalFinancePage() {
  const { child } = usePortal();
  if (!child) return null;

  const invoices = child.student.enrollments.flatMap((item) => item.invoices);
  const totalDue = invoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.totalAmount) - Number(invoice.paidAmount),
    0,
  );
  const totalPaid = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.paidAmount),
    0,
  );

  return (
    <div className="space-y-6">
      <PortalTitle
        title="Écolage et paiements"
        subtitle="Situation des frais et reçus"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total payé</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {totalPaid.toLocaleString("fr-FR")}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Reste à payer</p>
          <p className="mt-2 text-3xl font-bold text-red-700">
            {totalDue.toLocaleString("fr-FR")}
          </p>
        </div>
      </div>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Échéances</h2>
        {invoices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2">Échéance</th>
                  <th className="p-2">Référence</th>
                  <th className="p-2">Montant</th>
                  <th className="p-2">Payé</th>
                  <th className="p-2">Reste</th>
                  <th className="p-2">Statut</th>
                  <th className="p-2">Reçus</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.invoiceId}
                    className="border-b last:border-0"
                  >
                    <td className="p-2">
                      {invoice.label}
                      <br />
                      <span className="text-xs text-gray-500">
                        Échéance :{" "}
                        {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {invoice.reference}
                    </td>
                    <td className="p-2">
                      {Number(invoice.totalAmount).toLocaleString("fr-FR")}
                    </td>
                    <td className="p-2">
                      {Number(invoice.paidAmount).toLocaleString("fr-FR")}
                    </td>
                    <td className="p-2 font-semibold">
                      {(
                        Number(invoice.totalAmount) - Number(invoice.paidAmount)
                      ).toLocaleString("fr-FR")}
                    </td>
                    <td className="p-2">
                      {invoiceStatusLabels[invoice.status] ?? invoice.status}
                    </td>
                    <td className="p-2">
                      {invoice.payments.length
                        ? invoice.payments.map((payment) => (
                            <div
                              key={payment.paymentId}
                              className="font-mono text-xs"
                            >
                              {payment.receipt?.number ?? "Reçu en préparation"}
                            </div>
                          ))
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Aucune facture enregistrée.</p>
        )}
      </section>
    </div>
  );
}
