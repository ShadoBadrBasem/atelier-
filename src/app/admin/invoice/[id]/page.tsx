import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/admin/PrintButton";
import { btnCls, btnGhostCls } from "@/components/ui";
import { fmtDate } from "@/lib/cairo";
import { formatEgp } from "@/lib/money";
import { PAYMENT_METHODS } from "@/lib/constants";
import { orderFinance } from "@/lib/domain/orderFinance";
import { BUSINESS, businessPhone } from "@/lib/business";

const methodLabel = (k: string) => PAYMENT_METHODS.find((m) => m.key === k)?.label ?? k;

// Printable invoice, outside the admin shell so it prints clean. "Save as PDF" in the
// print dialog gives a file to attach in WhatsApp.
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())) redirect("/admin/login");
  const { id } = await params;
  const o = await db.order.findUnique({
    where: { id },
    include: {
      client: true,
      payments: { orderBy: { paidAt: "asc" } },
      costs: { select: { category: true, amount: true } },
      materials: { select: { quantity: true, unitCost: true } },
    },
  });
  if (!o) notFound();
  const f = orderFinance(o, new Date());
  const phone = businessPhone();

  return (
    <main className="invoice-page">
      <div className="invoice-tools">
        <Link href={`/admin/orders/${o.id}`} className={btnGhostCls}>Back to order</Link>
        <PrintButton className={btnCls}>Print or save as PDF</PrintButton>
      </div>

      <article className="invoice-sheet">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-olive/40 pb-6">
          <div className="flex items-center gap-4">
            <Logo size={96} />
            <div>
              <p className="font-display text-2xl">{BUSINESS.name}</p>
              <p className="at-eyebrow">{BUSINESS.tagline}</p>
              {phone && <p className="mt-2 text-sm">WhatsApp {phone}</p>}
            </div>
          </div>
          <div className="text-end">
            <p className="at-eyebrow">Invoice</p>
            <p className="font-display text-3xl">{o.code}</p>
            <p className="text-sm">Issued {fmtDate(new Date())}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-olive/40 py-6 sm:grid-cols-2">
          <div>
            <p className="at-eyebrow mb-1">Billed to</p>
            <p className="font-display text-xl">{o.client.name}</p>
            {o.client.phone && <p className="text-sm">{o.client.phone}</p>}
            {o.client.email && <p className="text-sm">{o.client.email}</p>}
          </div>
          <div className="sm:text-end">
            <p className="at-eyebrow mb-1">Gown</p>
            <p className="font-display text-xl">{o.title}</p>
            <p className="text-sm">{o.kind === "bridal" ? "Bridal" : "Evening"}{o.eventDate ? ` · event ${fmtDate(o.eventDate)}` : ""}</p>
          </div>
        </section>

        <table className="at-table my-6">
          <tbody>
            <tr><td>Couture gown, made to measure</td><td className="num">{formatEgp(o.listPrice)}</td></tr>
            {f.discount > 0 && (
              <tr>
                <td>Discount{o.discountKind === "family_friends" ? " (family & friends)" : o.discountReason ? ` (${o.discountReason})` : ""}</td>
                <td className="num">−{formatEgp(f.discount)}</td>
              </tr>
            )}
            <tr><td className="font-display text-lg">Total</td><td className="num font-display text-lg">{formatEgp(f.finalPrice)}</td></tr>
          </tbody>
        </table>

        <p className="at-eyebrow mb-2">Payments received</p>
        {o.payments.length === 0 ? <p className="at-muted text-sm">No payments yet.</p> : (
          <table className="at-table mb-6">
            <tbody>
              {o.payments.map((p) => (
                <tr key={p.id}>
                  <td>{fmtDate(p.paidAt)} · {methodLabel(p.method)}{p.isDeposit ? " · deposit" : ""}</td>
                  <td className="num">{formatEgp(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="invoice-balance">
          <span>{f.balance > 0 ? "Balance due" : "Paid in full"}</span>
          <span className="tabular-nums">{formatEgp(f.balance)}</span>
        </div>
        {f.balance > 0 && o.balanceDueDate && <p className="mt-2 text-end text-sm">Due by {fmtDate(o.balanceDueDate)}</p>}

        <footer className="mt-10 border-t border-olive/40 pt-4 text-center text-sm">
          Thank you for choosing {BUSINESS.name}.
        </footer>
      </article>
    </main>
  );
}
