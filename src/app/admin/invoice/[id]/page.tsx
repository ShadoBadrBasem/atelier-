import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/admin/PrintButton";
import { InvoiceShare } from "@/components/admin/InvoiceShare";
import { btnGhostCls } from "@/components/ui";
import { loadInvoice } from "@/lib/invoice";
import { BUSINESS, businessExtras, businessPhone } from "@/lib/business";

// Printable invoice, outside the admin shell so it prints clean. The same design is
// drawn as a picture by /api/invoice/[id]/image for sharing on WhatsApp.
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())) redirect("/admin/login");
  const { id } = await params;
  const inv = await loadInvoice(id);
  if (!inv) notFound();
  const phone = businessPhone();
  const extra = businessExtras();

  return (
    <main className="invoice-page">
      <div className="invoice-tools">
        <Link href={`/admin/orders/${inv.orderId}`} className={btnGhostCls}>Back to order</Link>
        <div className="flex flex-wrap gap-2">
          <InvoiceShare orderId={inv.orderId} code={inv.code} />
          <PrintButton className={btnGhostCls}>Print or save PDF</PrintButton>
        </div>
      </div>

      <article className="inv">
        <div className="inv-logo"><Logo size={150} priority /></div>

        <div className="inv-head">
          <div>
            <p className="inv-script">invoice</p>
            <p className="inv-caps inv-strong">{inv.client.name}</p>
            {inv.client.phone && <p className="inv-caps">{inv.client.phone}</p>}
            {inv.client.email && <p className="inv-caps">{inv.client.email}</p>}
          </div>
          <dl className="inv-meta">
            <div><dt>No.</dt><dd>{inv.code}</dd></div>
            <div><dt>Date</dt><dd>{inv.issued}</dd></div>
            {inv.gownMeta && <div><dt>For</dt><dd>{inv.gownMeta}</dd></div>}
          </dl>
        </div>

        <section className="inv-table">
          <div className="inv-rule-head"><span>The gown</span><i /><span>Price</span></div>
          {inv.lines.map((l) => (
            <div key={l.label} className={`inv-line ${l.muted ? "is-muted" : ""}`}><span>{l.label}</span><span>{l.amount}</span></div>
          ))}
          <div className="inv-total"><span>Total</span><span>{inv.total}</span></div>

          {inv.received.length > 0 && (
            <>
              <div className="inv-rule-head inv-gap"><span>Received</span><i /><span /></div>
              {inv.received.map((l) => (
                <div key={l.label} className="inv-line is-muted"><span>{l.label}</span><span>{l.amount}</span></div>
              ))}
            </>
          )}

          <div className="inv-balance">
            <span>{inv.balance > 0 ? "Balance due" : "Paid in full"}</span>
            <span>{inv.balanceText}</span>
          </div>
          {inv.dueText && <p className="inv-due">{inv.dueText}</p>}
        </section>

        <footer className="inv-foot">
          <p className="inv-house"><span>{BUSINESS.name}</span><i /><span>{BUSINESS.tagline}</span></p>
          {phone && <p>WhatsApp {phone}</p>}
          <p>{extra.address ?? BUSINESS.city}</p>
          {(extra.website || extra.instagram) && (
            <div className="inv-corners"><span>{extra.website}</span><span>{extra.instagram}</span></div>
          )}
        </footer>
      </article>
    </main>
  );
}
