import { db } from "./db";
import { fmtDate } from "./cairo";
import { formatEgp, type Piasters } from "./money";
import { PAYMENT_METHODS } from "./constants";
import { orderFinance } from "./domain/orderFinance";

// One invoice model, rendered twice: the printable page and the shareable image.

export interface InvoiceLine {
  label: string;
  amount: string;
  muted?: boolean;
}

export interface InvoiceData {
  orderId: string;
  code: string;
  issued: string;
  client: { name: string; phone: string | null; email: string | null };
  gown: string;
  gownMeta: string;
  lines: InvoiceLine[];
  total: string;
  received: InvoiceLine[];
  balance: Piasters;
  balanceText: string;
  dueText: string | null;
}

const methodLabel = (k: string) => PAYMENT_METHODS.find((m) => m.key === k)?.label ?? k;

export async function loadInvoice(id: string): Promise<InvoiceData | null> {
  const o = await db.order.findUnique({
    where: { id },
    include: {
      client: true,
      payments: { orderBy: { paidAt: "asc" } },
      costs: { select: { category: true, amount: true } },
      materials: { select: { quantity: true, unitCost: true } },
    },
  });
  if (!o) return null;
  const f = orderFinance(o, new Date());

  const lines: InvoiceLine[] = [{ label: `${o.title} · made to measure`, amount: formatEgp(o.listPrice) }];
  if (f.discount > 0) {
    const why = o.discountKind === "family_friends" ? "Family & friends" : o.discountReason ?? "Discount";
    lines.push({ label: `Discount · ${why}`, amount: `−${formatEgp(f.discount)}`, muted: true });
  }

  return {
    orderId: o.id,
    code: o.code,
    issued: fmtDate(new Date()),
    client: { name: o.client.name, phone: o.client.phone, email: o.client.email },
    gown: o.title,
    gownMeta: [o.kind === "bridal" ? "Bridal" : "Evening", o.eventDate && `Event ${fmtDate(o.eventDate)}`].filter(Boolean).join(" · "),
    lines,
    total: formatEgp(f.finalPrice),
    received: o.payments.map((p) => ({
      label: `${fmtDate(p.paidAt)} · ${methodLabel(p.method)}${p.isDeposit ? " · deposit" : ""}`,
      amount: `−${formatEgp(p.amount)}`,
      muted: true,
    })),
    balance: f.balance,
    balanceText: formatEgp(f.balance),
    dueText: f.balance > 0 && o.balanceDueDate ? `Due by ${fmtDate(o.balanceDueDate)}` : null,
  };
}
