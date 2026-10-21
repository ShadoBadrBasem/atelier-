import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Gallery } from "@/components/Gallery";
import { PricingForm } from "@/components/PricingForm";
import { Badge, Field, btnCls, btnDangerCls, btnGhostCls, inputCls } from "@/components/ui";
import { Empty, PageTitle, Panel } from "@/components/admin/kit";
import { fmtDate, fmtDateTime, toDateInput } from "@/lib/cairo";
import { formatEgp } from "@/lib/money";
import { orderFinance } from "@/lib/domain/orderFinance";
import { stageColor } from "@/lib/phaseColors";
import { COST_CATEGORIES, PAYMENT_METHODS, PAYMENT_STATUS_STYLE, STAGES, apptLabel, stageLabel } from "@/lib/constants";
import { addCost, addPayment, deleteCost, deletePayment, savePricing, setStage, updateOrderInfo } from "../actions";

const methodLabel = (k: string) => PAYMENT_METHODS.find((m) => m.key === k)?.label ?? k;
const costLabel = (k: string) => COST_CATEGORIES.find((m) => m.key === k)?.label ?? k;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await db.order.findUnique({
    where: { id },
    include: {
      client: true,
      costs: { orderBy: { incurredAt: "desc" } },
      materials: { include: { item: true } },
      payments: { orderBy: { paidAt: "desc" } },
      stageLogs: { orderBy: { enteredAt: "desc" } },
      appointments: { orderBy: { startsAt: "asc" } },
    },
  });
  if (!o) notFound();
  const f = orderFinance(o, new Date());
  const ps = PAYMENT_STATUS_STYLE[f.status];
  const stageIdx = STAGES.findIndex((s) => s.key === o.stage);
  const egpNum = (p: number) => p / 100;

  return (
    <main className="flex flex-col gap-5">
      <PageTitle
        eyebrow={`Order ${o.code}`}
        title={o.title}
        sub={`${o.code} · ${o.kind} · ${o.eventDate ? `event ${fmtDate(o.eventDate)}` : "no event date"}`}
        action={<Badge cls={ps.cls}>{ps.label}</Badge>}
      />
      <p className="-mt-3 text-sm">
        Client: <Link className="underline" href={`/admin/clients/${o.client.id}`}>{o.client.name}</Link>
      </p>

      <Panel title="Progress">
        <ol className="mb-4 flex gap-1.5 overflow-x-auto p-1">
          {STAGES.map((s, i) => (
            <li key={s.key} className={`shrink-0 rounded-full px-3 py-1 text-[11px] uppercase tracking-wider ${i > stageIdx ? "border border-olive/40 text-ink-soft" : ""} ${i === stageIdx ? "ring-2 ring-oxblood ring-offset-2 ring-offset-[#fbf7ef]" : ""}`}
              style={i <= stageIdx ? { background: stageColor(s.key).bg, color: stageColor(s.key).fg, opacity: i < stageIdx ? 0.7 : 1 } : undefined}>
              {s.label}
            </li>
          ))}
        </ol>
        <form action={setStage.bind(null, o.id)} className="flex flex-wrap items-end gap-2">
          <Field label="Move to stage">
            <select name="stage" defaultValue={STAGES[Math.min(stageIdx + 1, STAGES.length - 1)].key} className={inputCls}>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
          <div className="min-w-40 flex-1"><Field label="Note"><input name="note" className={inputCls} /></Field></div>
          <button className={btnCls}>Update</button>
        </form>
        <ul className="mt-3 text-sm text-ink-soft">
          {o.stageLogs.map((l) => (
            <li key={l.id}>{fmtDate(l.enteredAt)} · {stageLabel(l.stage)}{l.note ? ` · ${l.note}` : ""}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="Pricing & payment">
        <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-4">
          <dt className="text-ink-soft">List price</dt><dd className="tabular-nums">{formatEgp(o.listPrice)}</dd>
          <dt className="text-ink-soft">Discount</dt>
          <dd className="tabular-nums">
            {f.discount ? `−${formatEgp(f.discount)}` : "None"}
            {o.discountKind === "family_friends" && <Badge cls="ms-1 bg-copper/30 text-oxblood">Family & friends</Badge>}
            {o.discountKind === "other" && o.discountReason && <span className="text-ink-soft"> ({o.discountReason})</span>}
          </dd>
          <dt className="text-ink-soft">Final price</dt><dd className="font-display tabular-nums">{formatEgp(f.finalPrice)}</dd>
          <dt className="text-ink-soft">Paid so far</dt><dd className="tabular-nums">{formatEgp(f.paid)}</dd>
          <dt className="text-ink-soft">Remaining</dt><dd className="tabular-nums">{formatEgp(f.balance)}</dd>
          <dt className="text-ink-soft">Deposit</dt>
          <dd>
            {o.depositAmount ? formatEgp(o.depositAmount) : "Not set"}{" "}
            {o.depositAmount > 0 && <Badge cls={f.depositPaid ? "bg-olive text-cream" : "bg-sand text-oxblood"}>{f.depositPaid ? "Paid" : "Not paid"}</Badge>}
            {o.depositDueDate && <span className="text-ink-soft"> due {fmtDate(o.depositDueDate)}</span>}
          </dd>
          <dt className="text-ink-soft">Balance due</dt><dd>{o.balanceDueDate ? fmtDate(o.balanceDueDate) : "Not set"}</dd>
          <dt className="text-ink-soft">Dress cost</dt><dd className="tabular-nums">{formatEgp(f.totalCost)}</dd>
          <dt className="text-ink-soft">Profit</dt>
          <dd className={`tabular-nums ${f.profit < 0 ? "text-burnt" : ""}`}>{formatEgp(f.profit)} ({(f.marginBps / 100).toFixed(1)}%)</dd>
          {f.discount > 0 && (<><dt className="text-ink-soft">Discount cost you</dt><dd className="tabular-nums text-burnt">{formatEgp(f.discount)}</dd></>)}
        </dl>
        <details className="at-disclosure">
          <summary>Edit pricing, deposit and due dates</summary>
          <div>
            <PricingForm
              action={savePricing.bind(null, o.id)}
              initial={{
                listPrice: egpNum(o.listPrice),
                discountKind: o.discountKind,
                discountMode: o.discountMode,
                discountValue: o.discountMode === "percent" ? o.discountValue / 100 : egpNum(o.discountValue),
                discountReason: o.discountReason ?? "",
                depositAmount: egpNum(o.depositAmount),
                depositDueDate: toDateInput(o.depositDueDate),
                balanceDueDate: toDateInput(o.balanceDueDate),
              }}
            />
          </div>
        </details>
      </Panel>

      <Panel title="Payments">
        <form action={addPayment.bind(null, o.id)} className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6 md:items-end">
          <Field label="Amount (EGP)"><input name="amount" required inputMode="decimal" className={inputCls} /></Field>
          <Field label="Date"><input name="paidAt" type="date" defaultValue={toDateInput(new Date())} className={inputCls} /></Field>
          <Field label="Method">
            <select name="method" className={inputCls}>{PAYMENT_METHODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
          </Field>
          <Field label="Note"><input name="note" className={inputCls} /></Field>
          <label className="flex items-center gap-2 py-3 text-sm"><input type="checkbox" name="isDeposit" defaultChecked={!f.depositPaid && o.depositAmount > 0} /> Deposit</label>
          <button className={btnCls}>Record</button>
        </form>
        {o.payments.length === 0 ? <Empty>No payments yet.</Empty> : (
          <ul className="divide-y divide-olive/20 text-sm">
            {o.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                <span>{fmtDate(p.paidAt)} · {methodLabel(p.method)}{p.isDeposit ? " · deposit" : ""}{p.note ? ` · ${p.note}` : ""}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{formatEgp(p.amount)}</span>
                  <form action={deletePayment.bind(null, o.id, p.id)}><button className={btnDangerCls} aria-label="Delete payment">×</button></form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Dress cost">
        <dl className="mb-3 grid grid-cols-2 gap-1 text-sm md:grid-cols-4">
          <dt className="text-ink-soft">Materials (from inventory)</dt><dd className="tabular-nums">{formatEgp(f.materials)}</dd>
          <dt className="text-ink-soft">Labor & outsourced</dt><dd className="tabular-nums">{formatEgp(f.labor)}</dd>
          <dt className="text-ink-soft">Other</dt><dd className="tabular-nums">{formatEgp(f.other)}</dd>
          <dt className="font-display">Total</dt><dd className="font-display tabular-nums">{formatEgp(f.totalCost)}</dd>
        </dl>
        {o.materials.length > 0 && (
          <ul className="mb-3 text-sm text-ink-soft">
            {o.materials.map((m) => <li key={m.id}>{m.item.name}: {m.quantity} {m.item.unit} × {formatEgp(m.unitCost)}</li>)}
          </ul>
        )}
        <form action={addCost.bind(null, o.id)} className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5 md:items-end">
          <Field label="Type">
            <select name="category" className={inputCls}>{COST_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
          </Field>
          <Field label="Description"><input name="description" required className={inputCls} /></Field>
          <Field label="Amount (EGP)"><input name="amount" required inputMode="decimal" className={inputCls} /></Field>
          <Field label="Date"><input name="incurredAt" type="date" defaultValue={toDateInput(new Date())} className={inputCls} /></Field>
          <button className={btnGhostCls}>Add cost</button>
        </form>
        <ul className="divide-y divide-olive/20 text-sm">
          {o.costs.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
              <span>{fmtDate(c.incurredAt)} · {costLabel(c.category)} · {c.description}</span>
              <span className="flex items-center gap-2">
                <span className="tabular-nums">{formatEgp(c.amount)}</span>
                <form action={deleteCost.bind(null, o.id, c.id)}><button className={btnDangerCls} aria-label="Delete cost">×</button></form>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-soft">Materials are assigned from Supplies (milestone 5), which deducts stock and adds the cost here.</p>
      </Panel>

      <Panel title="Photos & design files">
        <Gallery orderId={o.id} defaultCategory="sketch" />
      </Panel>

      <Panel title="Appointments" action={<Link className="text-sm underline" href={`/admin/calendar/new?orderId=${o.id}`}>Schedule</Link>}>
        {o.appointments.length === 0 ? <Empty>None scheduled.</Empty> : (
          <ul className="text-sm">
            {o.appointments.map((a) => <li key={a.id}>{fmtDateTime(a.startsAt)} · {apptLabel(a.type)} · {a.status}</li>)}
          </ul>
        )}
      </Panel>

      <Panel title="Details">
        <form action={updateOrderInfo.bind(null, o.id)} className="grid gap-3 md:grid-cols-3">
          <Field label="Title"><input name="title" required defaultValue={o.title} className={inputCls} /></Field>
          <Field label="Type">
            <select name="kind" defaultValue={o.kind} className={inputCls}><option value="bridal">Bridal</option><option value="evening">Evening</option></select>
          </Field>
          <Field label="Event date"><input name="eventDate" type="date" defaultValue={toDateInput(o.eventDate)} className={inputCls} /></Field>
          <div className="md:col-span-3"><Field label="Notes, fabrics, details"><textarea name="notes" rows={4} defaultValue={o.notes ?? ""} className={inputCls} /></Field></div>
          <div><button className={btnGhostCls}>Save details</button></div>
        </form>
      </Panel>
    </main>
  );
}
