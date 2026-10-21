import Link from "next/link";
import { db } from "@/lib/db";
import { Field, btnCls, btnDangerCls, inputCls } from "@/components/ui";
import { Empty, Meter, PageTitle, Panel, Stat, Stats } from "@/components/admin/kit";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SuppliesNav } from "@/components/admin/SuppliesNav";
import { fmtDate, startOfDay, toDateInput, todayKey } from "@/lib/cairo";
import { formatEgp } from "@/lib/money";
import { COST_CATEGORIES, EXPENSE_CATEGORIES, expenseLabel } from "@/lib/constants";
import { createExpense, deleteExpense, updateExpense } from "../actions";

const monthLabel = (m: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-15T12:00:00Z`));
const shiftMonth = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
const costLabel = (k: string) => COST_CATEGORIES.find((c) => c.key === k)?.label ?? k;

export default async function CostsPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const sp = await searchParams;
  const m = sp.m && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : todayKey().slice(0, 7);
  const from = startOfDay(`${m}-01`);
  const to = startOfDay(`${shiftMonth(m, 1)}-01`);
  const range = { gte: from, lt: to };

  const [expenses, orderCosts, payments] = await Promise.all([
    db.expense.findMany({ where: { spentAt: range }, orderBy: { spentAt: "desc" } }),
    db.orderCost.findMany({ where: { incurredAt: range }, orderBy: { incurredAt: "desc" }, include: { order: { select: { id: true, code: true, title: true } } } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { paidAt: range } }),
  ]);
  const received = payments._sum.amount ?? 0;
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const orderCostTotal = orderCosts.reduce((s, c) => s + c.amount, 0);
  // Materials used on orders are not counted again: their cost was spent when the supply was bought.
  const spent = expenseTotal + orderCostTotal;
  const net = received - spent;

  const byCat: { key: string; label: string; total: number }[] = EXPENSE_CATEGORIES.map((c) => ({ key: c.key, label: c.label, total: expenses.filter((e) => e.category === c.key).reduce((s, e) => s + e.amount, 0) }))
    .filter((c) => c.total > 0);
  if (orderCostTotal > 0) byCat.push({ key: "orders", label: "Order labor & outsourcing", total: orderCostTotal });
  byCat.sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...byCat.map((c) => c.total));
  const isThisMonth = m === todayKey().slice(0, 7);

  return (
    <main className="flex flex-col gap-5">
      <PageTitle eyebrow="Supplies & costs" title="Costs" sub={monthLabel(m)} />
      <div className="cal-bar">
        <SuppliesNav current="costs" />
        <nav className="cal-nav" aria-label="Choose month">
          <Link href={`?m=${shiftMonth(m, -1)}`} aria-label="Previous month">‹</Link>
          <Link href="?">This month</Link>
          <Link href={`?m=${shiftMonth(m, 1)}`} aria-label="Next month">›</Link>
        </nav>
      </div>

      <Stats>
        <Stat label="Received" value={formatEgp(received)} hint="client payments" tone="good" />
        <Stat label="Spent" value={formatEgp(spent)} hint={`${expenses.length + orderCosts.length} entries`} tone="copper" />
        <Stat label="Net" value={formatEgp(net)} tone={net < 0 ? "warn" : "ox"} />
        <Stat label="Biggest cost" value={byCat[0] ? byCat[0].label : "None"} hint={byCat[0] ? formatEgp(byCat[0].total) : undefined} />
      </Stats>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Where the money went" className="lg:col-span-1">
          {byCat.length === 0 ? <Empty>No costs this month.</Empty> : (
            <ul className="flex flex-col gap-3">
              {byCat.map((c) => (
                <li key={c.key}>
                  <div className="mb-1 flex justify-between text-sm"><span>{c.label}</span><span className="tabular-nums">{formatEgp(c.total)}</span></div>
                  <Meter value={c.total / max} warn />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Add a cost" eyebrow="New expense" className="lg:col-span-2">
          <form action={createExpense} className="grid grid-cols-2 gap-3 md:grid-cols-4 md:items-end">
            <Field label="Category">
              <select name="category" className={inputCls}>{EXPENSE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
            </Field>
            <Field label="Amount (EGP)"><input name="amount" required inputMode="decimal" className={inputCls} /></Field>
            <Field label="Date"><input name="spentAt" type="date" defaultValue={isThisMonth ? todayKey() : `${m}-01`} className={inputCls} /></Field>
            <Field label="Description"><input name="description" placeholder="e.g. Atelier rent" className={inputCls} /></Field>
            <div className="col-span-2 md:col-span-4"><button className={btnCls}>Add cost</button></div>
          </form>
          <p className="at-muted mt-3 text-sm">Supply purchases are added here automatically. Labor and outsourcing for a gown are added on its order.</p>
        </Panel>
      </div>

      <Panel title="Expenses" eyebrow={monthLabel(m)}>
        {expenses.length === 0 ? <Empty>No expenses recorded for this month.</Empty> : (
          <ul className="at-rows">
            {expenses.map((e) => (
              <li key={e.id} className="py-2">
                <div className="at-row px-0">
                  <div className="min-w-0">
                    <div className="text-sm">{fmtDate(e.spentAt)} · {expenseLabel(e.category)}</div>
                    <div className="at-row-meta">{e.description ?? "No description"}{e.purchaseId ? " · from a supply purchase" : ""}</div>
                  </div>
                  <span className="font-display tabular-nums">{formatEgp(e.amount)}</span>
                </div>
                <details className="at-disclosure">
                  <summary>Edit</summary>
                  <form action={updateExpense.bind(null, e.id)} className="grid grid-cols-2 gap-3 md:grid-cols-[10rem_9rem_10rem_1fr_auto] md:items-end">
                    <Field label="Category">
                      <select name="category" defaultValue={e.category} className={inputCls}>{EXPENSE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
                    </Field>
                    <Field label="Amount (EGP)"><input name="amount" required inputMode="decimal" defaultValue={e.amount / 100} className={inputCls} /></Field>
                    <Field label="Date"><input name="spentAt" type="date" defaultValue={toDateInput(e.spentAt)} className={inputCls} /></Field>
                    <Field label="Description"><input name="description" defaultValue={e.description ?? ""} className={inputCls} /></Field>
                    <button className={btnCls}>Save</button>
                  </form>
                  <form action={deleteExpense.bind(null, e.id)} className="mt-3">
                    <ConfirmButton message="Delete this cost?" className={btnDangerCls}>Delete</ConfirmButton>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Order costs" eyebrow="Labor & outsourcing">
        {orderCosts.length === 0 ? <Empty>No order costs this month.</Empty> : (
          <ul className="at-rows">
            {orderCosts.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/orders/${c.order.id}`} className="at-row">
                  <div className="min-w-0">
                    <div className="text-sm">{fmtDate(c.incurredAt)} · {c.order.code} · {costLabel(c.category)}</div>
                    <div className="at-row-meta">{c.description}</div>
                  </div>
                  <span className="tabular-nums">{formatEgp(c.amount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </main>
  );
}
