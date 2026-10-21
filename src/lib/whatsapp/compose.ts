import type { Appointment, Client, Order } from "@prisma/client";
import { fmtDate, fmtTime } from "../cairo";
import { formatEgp, type Piasters } from "../money";
import type { OrderFinance } from "../domain/orderFinance";
import { DEFAULT_TEMPLATES, render, type Lang, type TemplateKey } from "./templates";

// Builds ready-to-send WhatsApp messages. Sending goes through `waLink` today
// (one tap opens WhatsApp on the founder's device); a Business Cloud API sender
// can replace it later without touching the callers.

export interface ComposedMessage {
  key: TemplateKey;
  body: string;
}

export type Overrides = Partial<Record<string, string>>; // `${key}:${lang}` -> body

/** wa.me link that opens a chat with `to` (digits only) and the text filled in. */
export function waLink(to: string, body: string): string {
  return `https://wa.me/${to}?text=${encodeURIComponent(body)}`;
}

const APPT_TYPE: Record<string, Record<Lang, string>> = {
  consultation: { en: "consultation", ar: "الاستشارة" },
  measurements: { en: "measurements appointment", ar: "أخذ المقاسات" },
  fitting1: { en: "first fitting", ar: "البروفة الأولى" },
  fitting2: { en: "second fitting", ar: "البروفة الثانية" },
  fitting3: { en: "third fitting", ar: "البروفة الثالثة" },
  final_fitting: { en: "final fitting", ar: "البروفة النهائية" },
  delivery: { en: "gown collection", ar: "استلام الفستان" },
};

const langOf = (c: Pick<Client, "language">): Lang => (c.language === "ar" ? "ar" : "en");
const loc = (l: Lang) => (l === "ar" ? "ar-EG" : "en-GB");
const date = (d: Date, l: Lang) => new Intl.DateTimeFormat(loc(l), { timeZone: "Africa/Cairo", weekday: "long", day: "numeric", month: "long" }).format(d);
const money = (p: Piasters, l: Lang) => formatEgp(p, l);
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

function bodyFor(key: TemplateKey, l: Lang, overrides: Overrides) {
  return overrides[`${key}:${l}`] ?? DEFAULT_TEMPLATES[key][l];
}

export function composeAppointment(
  a: Pick<Appointment, "type" | "startsAt">,
  client: Pick<Client, "name" | "language">,
  overrides: Overrides = {},
): ComposedMessage[] {
  const l = langOf(client);
  const vars = {
    name: firstName(client.name),
    type: APPT_TYPE[a.type]?.[l] ?? a.type,
    date: date(a.startsAt, l),
    time: fmtTime(a.startsAt, loc(l)),
  };
  return (["booking_confirmed", "reminder_24h"] as const).map((key) => ({ key, body: render(bodyFor(key, l, overrides), vars) }));
}

export interface InvoiceInput {
  order: Pick<Order, "code" | "title" | "listPrice" | "discountKind" | "discountReason" | "depositAmount" | "depositDueDate" | "balanceDueDate">;
  finance: Pick<OrderFinance, "discount" | "finalPrice" | "paid" | "balance">;
  payments: { amount: Piasters; paidAt: Date; isDeposit: boolean }[];
}

/** Plain-text invoice for a WhatsApp message. */
export function invoiceText({ order, finance, payments }: InvoiceInput, l: Lang): string {
  const T = l === "ar"
    ? { gown: "الفستان", price: "السعر", discount: "خصم", ff: "الأهل والأصدقاء", total: "الإجمالي", paid: "المدفوع", deposit: "عربون", payment: "دفعة", balance: "المتبقي", due: "مستحق قبل", settled: "تم السداد بالكامل" }
    : { gown: "Gown", price: "Price", discount: "Discount", ff: "family & friends", total: "Total", paid: "Paid", deposit: "deposit", payment: "payment", balance: "Balance", due: "due by", settled: "Paid in full" };
  const lines = [`${T.gown}: ${order.title}`, `${T.price}: ${money(order.listPrice, l)}`];
  if (finance.discount > 0) {
    const why = order.discountKind === "family_friends" ? ` (${T.ff})` : order.discountReason ? ` (${order.discountReason})` : "";
    lines.push(`${T.discount}${why}: −${money(finance.discount, l)}`);
  }
  lines.push(`${T.total}: ${money(finance.finalPrice, l)}`);
  for (const p of [...payments].sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime())) {
    lines.push(`${T.paid} ${fmtDate(p.paidAt, loc(l))} (${p.isDeposit ? T.deposit : T.payment}): ${money(p.amount, l)}`);
  }
  if (finance.balance > 0) {
    const due = order.balanceDueDate ? ` · ${T.due} ${fmtDate(order.balanceDueDate, loc(l))}` : "";
    lines.push(`${T.balance}: ${money(finance.balance, l)}${due}`);
  } else {
    lines.push(T.settled);
  }
  return lines.join("\n");
}

export function composeOrder(
  input: InvoiceInput & { nextAppointment?: Pick<Appointment, "startsAt"> | null },
  client: Pick<Client, "name" | "language">,
  overrides: Overrides = {},
): ComposedMessage[] {
  const l = langOf(client);
  const { order, finance, nextAppointment } = input;
  const depositOwed = Math.max(0, order.depositAmount - Math.min(finance.paid, order.depositAmount));
  const next = nextAppointment
    ? l === "ar"
      ? `موعدك يوم ${date(nextAppointment.startsAt, l)} الساعة ${fmtTime(nextAppointment.startsAt, loc(l))}.`
      : `Your appointment is on ${date(nextAppointment.startsAt, l)} at ${fmtTime(nextAppointment.startsAt, loc(l))}.`
    : l === "ar" ? "ردّي علينا هنا ونحدد معكِ الموعد المناسب." : "Reply here and we will find a time that suits you.";
  const soon = l === "ar" ? "أقرب وقت" : "as soon as possible";
  const vars = {
    name: firstName(client.name),
    gown: order.title,
    code: order.code,
    next,
    invoice: invoiceText(input, l),
  };
  const out: ComposedMessage[] = [{ key: "invoice", body: render(bodyFor("invoice", l, overrides), vars) }];
  if (depositOwed > 0) {
    const due = order.depositDueDate ? fmtDate(order.depositDueDate, loc(l)) : soon;
    out.push({ key: "deposit_due", body: render(bodyFor("deposit_due", l, overrides), { ...vars, amount: money(depositOwed, l), due }) });
  }
  if (finance.balance > 0) {
    const due = order.balanceDueDate ? fmtDate(order.balanceDueDate, loc(l)) : soon;
    out.push({ key: "balance_due", body: render(bodyFor("balance_due", l, overrides), { ...vars, amount: money(finance.balance, l), due }) });
  }
  out.push({ key: "fitting_ready", body: render(bodyFor("fitting_ready", l, overrides), vars) });
  out.push({ key: "delivery_ready", body: render(bodyFor("delivery_ready", l, overrides), vars) });
  return out;
}
