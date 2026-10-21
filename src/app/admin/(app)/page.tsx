import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { Empty, PageTitle, Panel, Stat, Stats } from "@/components/admin/kit";
import { TaskList } from "@/components/TaskList";
import { addDaysKey, fmtDate, fmtTime, fmtWeekday, startOfDay, todayKey } from "@/lib/cairo";
import { formatEgp } from "@/lib/money";
import { PAYMENT_STATUS_STYLE, apptLabel, stageLabel } from "@/lib/constants";
import { ordersWithFinance } from "@/lib/orderQueries";

export default async function Dashboard() {
  const tk = todayKey();
  const today = startOfDay(tk);
  const tomorrow = startOfDay(addDaysKey(tk, 1));
  const in7 = startOfDay(addDaysKey(tk, 8));
  const in30 = startOfDay(addDaysKey(tk, 31));
  const monthStart = startOfDay(`${tk.slice(0, 7)}-01`);
  const nextMonthStart = startOfDay(addDaysKey(`${tk.slice(0, 7)}-28`, 7).slice(0, 7) + "-01");

  const [todayAppts, upcoming, tasks, pending, orders, inventory, monthPayments, monthCosts, monthExpenses] = await Promise.all([
    db.appointment.findMany({ where: { startsAt: { gte: today, lt: tomorrow }, status: { not: "cancelled" } }, orderBy: { startsAt: "asc" }, include: { client: { select: { name: true } } } }),
    db.appointment.findMany({ where: { startsAt: { gte: tomorrow, lt: in7 }, status: "scheduled" }, orderBy: { startsAt: "asc" }, include: { client: { select: { name: true } } } }),
    db.task.findMany({ where: { done: false, dueDate: { lt: tomorrow } }, orderBy: [{ dueDate: "asc" }, { priority: "asc" }], include: { order: { select: { id: true, code: true } }, client: { select: { id: true, name: true } } } }),
    db.bookingRequest.count({ where: { status: "pending" } }),
    ordersWithFinance({ stage: { not: "delivered" } }),
    db.inventoryItem.findMany({ select: { id: true, name: true, stock: true, reorderLevel: true, unit: true } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: monthStart, lt: nextMonthStart } } }),
    db.orderCost.aggregate({ _sum: { amount: true }, where: { incurredAt: { gte: monthStart, lt: nextMonthStart } } }),
    db.expense.aggregate({ _sum: { amount: true }, where: { spentAt: { gte: monthStart, lt: nextMonthStart } } }),
  ]);

  const nearDeadline = orders.filter((o) => o.eventDate && o.eventDate < in30 && o.stage !== "ready");
  const paymentAlerts = orders.filter(
    (o) => o.finance.status === "overdue" ||
      (o.finance.balance > 0 && o.balanceDueDate && o.balanceDueDate < in7) ||
      (!o.finance.depositPaid && o.depositAmount > 0 && o.depositDueDate && o.depositDueDate < in7),
  );
  const lowStock = inventory.filter((i) => i.stock <= i.reorderLevel);
  const revenue = monthPayments._sum.amount ?? 0;
  // Order costs + general expenses. Purchases are logged as expenses in milestone 5.
  const costs = (monthCosts._sum.amount ?? 0) + (monthExpenses._sum.amount ?? 0);

  return (
    <main className="flex flex-col gap-5">
      <PageTitle eyebrow={fmtWeekday(new Date())} title="Today" sub={`${todayAppts.length} appointment${todayAppts.length === 1 ? "" : "s"} · ${tasks.length} task${tasks.length === 1 ? "" : "s"} due`} />

      {pending > 0 && (
        <Link href="/admin/calendar" className="at-callout">
          <span>{pending} booking request{pending > 1 ? "s" : ""} waiting for you</span>
          <span aria-hidden>→</span>
        </Link>
      )}

      <Stats>
        <Stat label="Open orders" value={orders.length} hint={`${nearDeadline.length} due within 30 days`} tone="ox" />
        <Stat label="Received this month" value={formatEgp(revenue)} tone="good" />
        <Stat label="Costs this month" value={formatEgp(costs)} tone="copper" />
        <Stat label="Net this month" value={formatEgp(revenue - costs)} tone={revenue - costs < 0 ? "warn" : "good"} />
      </Stats>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Agenda">
          {todayAppts.length === 0 ? <Empty>No appointments today.</Empty> : (
            <ul className="flex flex-col gap-2">
              {todayAppts.map((a) => (
                <li key={a.id}><Link href={`/admin/calendar/${a.id}`} className="flex justify-between gap-2">
                  <span className="tabular-nums">{fmtTime(a.startsAt)}</span>
                  <span className="flex-1">{apptLabel(a.type)} · {a.client?.name ?? "No client"}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Tasks" action={<Link href="/admin/tasks" className="text-sm underline">All</Link>}>
          {tasks.length === 0 ? <Empty>All done.</Empty> : <TaskList tasks={tasks} />}
        </Panel>

        <Panel title="Next 7 days">
          {upcoming.length === 0 ? <Empty>No upcoming fittings.</Empty> : (
            <ul className="flex flex-col gap-1 text-sm">
              {upcoming.map((a) => (
                <li key={a.id}><Link href={`/admin/calendar/${a.id}`}>{fmtWeekday(a.startsAt)} {fmtTime(a.startsAt)} · {apptLabel(a.type)} · {a.client?.name}</Link></li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Payments to watch">
          {paymentAlerts.length === 0 ? <Empty>Nothing due this week.</Empty> : (
            <ul className="flex flex-col gap-2 text-sm">
              {paymentAlerts.map((o) => (
                <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-2">
                  <span>{o.client.name} · {o.code}</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{formatEgp(o.finance.balance)}</span>
                    <Badge cls={PAYMENT_STATUS_STYLE[o.finance.status].cls}>{PAYMENT_STATUS_STYLE[o.finance.status].label}</Badge>
                  </span>
                </Link></li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Gowns near deadline">
          {nearDeadline.length === 0 ? <Empty>No gowns due within 30 days.</Empty> : (
            <ul className="flex flex-col gap-1 text-sm">
              {nearDeadline.map((o) => (
                <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex justify-between gap-2">
                  <span>{o.title} · {o.client.name}</span>
                  <span className="text-ink-soft">{stageLabel(o.stage)} · {fmtDate(o.eventDate)}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Low stock">
          {lowStock.length === 0 ? <Empty>Stock is fine.</Empty> : (
            <ul className="text-sm">{lowStock.map((i) => <li key={i.id}>{i.name}: {i.stock} {i.unit} (reorder at {i.reorderLevel})</li>)}</ul>
          )}
        </Panel>
      </div>

    </main>
  );
}
