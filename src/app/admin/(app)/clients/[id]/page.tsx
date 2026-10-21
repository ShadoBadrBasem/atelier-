import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Gallery } from "@/components/Gallery";
import { ClientDiscountForm } from "@/components/admin/ClientDiscountForm";
import { Badge, Field, btnCls, btnGhostCls, inputCls } from "@/components/ui";
import { Empty, Meter, PageTitle, Panel, Stat, Stats } from "@/components/admin/kit";
import { fmtDate, toDateInput } from "@/lib/cairo";
import { formatEgp } from "@/lib/money";
import { MEASUREMENT_FIELDS, PAYMENT_METHODS, PAYMENT_STATUS_STYLE, stageLabel } from "@/lib/constants";
import { orderFinance } from "@/lib/domain/orderFinance";
import { clientAccount, discountLabel } from "@/lib/domain/clientAccount";
import { WaQuickLink, WhatsAppSend } from "@/components/admin/WhatsAppSend";
import { composeAppointment, composeOrder } from "@/lib/whatsapp/compose";
import { loadOverrides } from "@/lib/whatsapp/overrides";
import { templateLabel } from "@/lib/whatsapp/templates";
import { addMeasurement, recordDeposit, saveClientDiscount, setDepositRequired } from "../actions";

const methodLabel = (k: string) => PAYMENT_METHODS.find((m) => m.key === k)?.label ?? k;

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const client = await db.client.findUnique({
    where: { id },
    include: {
      measurements: { orderBy: { version: "desc" } },
      messages: { orderBy: { sentAt: "desc" }, take: 12, include: { order: { select: { code: true } } } },
      appointments: { where: { status: "scheduled", startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, take: 1 },
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          costs: { select: { category: true, amount: true } },
          materials: { select: { quantity: true, unitCost: true } },
          payments: { orderBy: { paidAt: "desc" } },
        },
      },
    },
  });
  if (!client) notFound();

  const now = new Date();
  const orders = client.orders.map((o) => ({ ...o, finance: orderFinance(o, now) }));
  const acct = clientAccount(orders);
  const openOrders = orders.filter((o) => o.stage !== "delivered");
  const depositPayments = orders
    .flatMap((o) => o.payments.filter((p) => p.isDeposit).map((p) => ({ ...p, code: o.code })))
    .sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
  const standing = discountLabel(client, formatEgp);
  // Suggest the order still owing the most deposit.
  const suggested = [...orders].sort(
    (a, b) => (b.depositAmount - Math.min(b.finance.paid, b.depositAmount)) - (a.depositAmount - Math.min(a.finance.paid, a.depositAmount)),
  )[0];

  const overrides = await loadOverrides();
  const nextAppt = client.appointments[0] ?? null;
  const waOptions = [
    ...(nextAppt ? composeAppointment(nextAppt, client, overrides).map((m) => ({ key: m.key, label: templateLabel(m.key), body: m.body, orderId: nextAppt.orderId })) : []),
    ...openOrders.flatMap((o) =>
      composeOrder({ order: o, finance: o.finance, payments: o.payments, nextAppointment: nextAppt }, client, overrides)
        .filter((m) => m.key === "invoice" || m.key === "deposit_due" || m.key === "balance_due")
        .map((m) => ({ key: m.key, label: `${templateLabel(m.key)} · ${o.code}`, body: m.body, orderId: o.id })),
    ),
  ];

  const latest = client.measurements[0];
  const latestData = (latest?.data ?? {}) as Record<string, number>;
  const contact = [client.phone, client.email].filter(Boolean).join(" · ");

  return (
    <main className="flex flex-col gap-5">
      <PageTitle
        eyebrow={["Client", client.eventType, client.eventDate && `Event ${fmtDate(client.eventDate)}`].filter(Boolean).join(" · ")}
        title={client.name}
        sub={contact || undefined}
        action={
          <>
            <Link href={`/admin/clients/${client.id}/edit`} className={btnGhostCls}>Edit details</Link>
            <Link href={`/admin/orders/new?clientId=${client.id}`} className={btnCls}>New order</Link>
          </>
        }
      />

      {saved && <p role="status" className="at-callout">Changes saved.</p>}

      <Stats>
        <Stat label="Total value" value={formatEgp(acct.finalTotal)} hint={acct.discountTotal > 0 ? `after ${formatEgp(acct.discountTotal)} discount` : `${orders.length} order${orders.length === 1 ? "" : "s"}`} tone="ox" />
        <Stat label="Paid" value={formatEgp(acct.paid)} tone="good" />
        <Stat
          label="Deposits"
          value={formatEgp(acct.depositCollected)}
          hint={acct.depositRequired > 0 ? (acct.depositOutstanding > 0 ? `${formatEgp(acct.depositOutstanding)} still owed` : "All deposits in") : "None required yet"}
          tone={acct.depositOutstanding > 0 ? "copper" : "good"}
        />
        <Stat label="Balance due" value={formatEgp(acct.balance)} tone={acct.balance > 0 ? "warn" : "good"} />
      </Stats>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Deposits" eyebrow="Per order" className="lg:col-span-2">
          {orders.length === 0 ? (
            <Empty>Create an order first, then record her deposit here.</Empty>
          ) : (
            <>
              <div className="-mx-1 overflow-x-auto">
                <table className="at-table min-w-[560px]">
                  <thead>
                    <tr><th>Order</th><th className="num">Required</th><th>Collected</th><th>Due</th><th /></tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const collected = Math.min(o.finance.paid, o.depositAmount);
                      const owed = o.depositAmount - collected;
                      return (
                        <tr key={o.id}>
                          <td>
                            <Link href={`/admin/orders/${o.id}`} className="underline-offset-4 hover:underline">{o.code}</Link>
                            <div className="at-row-meta">{o.title}</div>
                          </td>
                          <td className="num">{o.depositAmount ? formatEgp(o.depositAmount) : <span className="at-muted">Not set</span>}</td>
                          <td className="min-w-36">
                            {o.depositAmount > 0 ? (
                              <>
                                <div className="mb-1 text-sm">{formatEgp(collected)}</div>
                                <Meter value={collected / o.depositAmount} warn={owed > 0} />
                              </>
                            ) : <span className="at-muted">—</span>}
                          </td>
                          <td className="text-sm">{o.depositDueDate ? fmtDate(o.depositDueDate) : <span className="at-muted">—</span>}</td>
                          <td>
                            {o.depositAmount > 0 && (owed > 0
                              ? <Badge cls={o.depositDueDate && o.depositDueDate < now ? "bg-burnt text-cream" : "bg-sand text-oxblood"}>{o.depositDueDate && o.depositDueDate < now ? "Overdue" : "Owed"}</Badge>
                              : <Badge cls="bg-[#7a6a1d] text-cream">Paid</Badge>)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid gap-6">
                <div>
                  <p className="at-eyebrow mb-3">Record a deposit</p>
                  <form action={recordDeposit.bind(null, client.id)} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
                    <div className="col-span-2">
                      <Field label="Order">
                        <select name="orderId" required defaultValue={suggested?.id} className={inputCls}>
                          {orders.map((o) => <option key={o.id} value={o.id}>{o.code} · {o.title}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Amount (EGP)"><input name="amount" required inputMode="decimal" className={inputCls} /></Field>
                    <Field label="Date"><input name="paidAt" type="date" defaultValue={toDateInput(now)} className={inputCls} /></Field>
                    <Field label="Method">
                      <select name="method" className={inputCls}>{PAYMENT_METHODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
                    </Field>
                    <Field label="Note"><input name="note" className={inputCls} /></Field>
                    <div className="col-span-2 sm:col-span-4"><button className={btnCls}>Record deposit</button></div>
                  </form>
                </div>

                <div>
                  <p className="at-eyebrow mb-3">Deposit received</p>
                  {depositPayments.length === 0 ? <Empty>No deposits recorded yet.</Empty> : (
                    <ul className="at-rows">
                      {depositPayments.map((p) => (
                        <li key={p.id} className="at-row">
                          <div>
                            <div className="text-sm">{fmtDate(p.paidAt)} · {p.code}</div>
                            <div className="at-row-meta">{methodLabel(p.method)}{p.note ? ` · ${p.note}` : ""}</div>
                          </div>
                          <span className="font-display tabular-nums">{formatEgp(p.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <details className="at-disclosure mt-4">
                <summary>Set the deposit required on an order</summary>
                <div className="flex flex-col gap-3">
                  {orders.map((o) => (
                    <form key={o.id} action={setDepositRequired.bind(null, client.id, o.id)} className="grid grid-cols-2 items-end gap-3 md:grid-cols-[1fr_10rem_10rem_auto]">
                      <div className="col-span-2 text-sm md:col-span-1">{o.code} · {o.title}<div className="at-row-meta">Final price {formatEgp(o.finance.finalPrice)}</div></div>
                      <Field label="Deposit (EGP)"><input name="depositAmount" inputMode="decimal" defaultValue={o.depositAmount ? o.depositAmount / 100 : ""} className={inputCls} /></Field>
                      <Field label="Due"><input name="depositDueDate" type="date" defaultValue={toDateInput(o.depositDueDate)} className={inputCls} /></Field>
                      <button className={btnGhostCls}>Save</button>
                    </form>
                  ))}
                </div>
              </details>
            </>
          )}
        </Panel>

        <Panel title="Discount" eyebrow="Standing">
          <div className="mb-4 border-b border-olive/20 pb-4">
            <p className="font-display text-xl">{standing ?? "No discount"}</p>
            {client.discountReason && <p className="at-muted mt-1 text-sm">{client.discountReason}</p>}
            <p className="at-muted mt-2 text-sm">
              Applied automatically to every new order for {client.name.split(" ")[0]}.
              {acct.discountTotal > 0 && ` Discounts given so far: ${formatEgp(acct.discountTotal)}.`}
            </p>
          </div>
          <ClientDiscountForm
            action={saveClientDiscount.bind(null, client.id)}
            openOrders={openOrders.length}
            initial={{
              discountKind: client.discountKind,
              discountMode: client.discountMode,
              discountValue: client.discountValue / 100, // basis points -> %, piasters -> EGP
              discountReason: client.discountReason ?? "",
            }}
          />
        </Panel>
      </div>

      <Panel
        title="WhatsApp"
        eyebrow="Reminders & invoices"
        action={<Link href="/admin/settings/messages" className="text-sm underline underline-offset-4">Edit wording</Link>}
      >
        {!client.whatsapp ? (
          <p className="at-muted text-sm">Add her WhatsApp number to send messages. <Link href={`/admin/clients/${client.id}/edit`} className="underline">Edit details</Link></p>
        ) : waOptions.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="at-muted text-sm">Nothing to remind her about yet. Messages appear here once she has an appointment or an order.</p>
            <WaQuickLink to={client.whatsapp} body="" templateKey="free_text" clientId={client.id}>Open chat</WaQuickLink>
          </div>
        ) : (
          <WhatsAppSend to={client.whatsapp} clientId={client.id} options={waOptions} rtl={client.language === "ar"} />
        )}
        {client.messages.length > 0 && (
          <details className="at-disclosure mt-4">
            <summary>Sent messages ({client.messages.length})</summary>
            <ul className="at-rows">
              {client.messages.map((m) => (
                <li key={m.id} className="py-2">
                  <div className="text-sm">{fmtDate(m.sentAt)} · {templateLabel(m.templateKey)}{m.order ? ` · ${m.order.code}` : ""}</div>
                  <p className="at-row-meta line-clamp-2 whitespace-pre-line" dir="auto">{m.body}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Panel>

      <Panel title="Orders">
        {orders.length === 0 ? (
          <Empty>No orders yet.</Empty>
        ) : (
          <ul className="at-rows">
            {orders.map((o) => {
              const ps = PAYMENT_STATUS_STYLE[o.finance.status];
              return (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="at-row">
                    <div className="min-w-0">
                      <div className="at-row-title truncate">{o.title}</div>
                      <div className="at-row-meta">
                        {o.code} · {stageLabel(o.stage)}
                        {o.finance.discount > 0 && ` · −${formatEgp(o.finance.discount)} discount`}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-sm tabular-nums sm:inline">{formatEgp(o.finance.finalPrice)}</span>
                      <Badge cls={ps.cls}>{ps.label}</Badge>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Details" action={<Link href={`/admin/clients/${client.id}/edit`} className={btnGhostCls}>Edit</Link>}>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Phone", client.phone],
            ["WhatsApp", client.whatsapp && `+${client.whatsapp}`],
            ["Email", client.email],
            ["Language", client.language === "ar" ? "Arabic" : "English"],
            ["Occasion", client.eventType && (client.eventType === "bridal" ? "Bridal" : "Evening")],
            ["Event date", client.eventDate && fmtDate(client.eventDate)],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="at-eyebrow">{k}</dt>
              <dd className="mt-1">{v || <span className="at-muted">Not set</span>}</dd>
            </div>
          ))}
          {client.notes && (
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="at-eyebrow">Notes</dt>
              <dd className="mt-1 whitespace-pre-line">{client.notes}</dd>
            </div>
          )}
        </dl>
      </Panel>

      <Panel title="Measurements" action={latest && <span className="at-muted text-sm">v{latest.version} · {fmtDate(latest.takenAt)}</span>}>
        <p className="at-muted mb-3 text-sm">
          Saving creates a new version. Earlier versions are kept below. Values in cm.
        </p>
        <form action={addMeasurement.bind(null, client.id)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {MEASUREMENT_FIELDS.map((f) => (
            <Field key={f} label={f}>
              <input name={f} inputMode="decimal" defaultValue={latestData[f] ?? ""} className={inputCls} />
            </Field>
          ))}
          <Field label="Taken on">
            <input name="takenAt" type="date" defaultValue={toDateInput(new Date())} className={inputCls} />
          </Field>
          <div className="col-span-2 md:col-span-3">
            <Field label="Notes">
              <input name="notes" className={inputCls} />
            </Field>
          </div>
          <div className="col-span-2 md:col-span-4">
            <button className={btnGhostCls}>Save as new version</button>
          </div>
        </form>
        {client.measurements.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="at-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Version</th>
                  {MEASUREMENT_FIELDS.map((f) => <th key={f}>{f}</th>)}
                </tr>
              </thead>
              <tbody>
                {client.measurements.map((m) => {
                  const d = m.data as Record<string, number>;
                  return (
                    <tr key={m.id}>
                      <td className="whitespace-nowrap">v{m.version} · {fmtDate(m.takenAt)}</td>
                      {MEASUREMENT_FIELDS.map((f) => <td key={f}>{d[f] ?? ""}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Inspiration & files">
        <Gallery clientId={client.id} defaultCategory="inspiration" />
      </Panel>
    </main>
  );
}
