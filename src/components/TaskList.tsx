import Link from "next/link";
import type { Task } from "@prisma/client";
import { fmtDate, startOfDay, toDateInput, todayKey } from "@/lib/cairo";
import { deleteTask, reorderTasks, toggleTask, updateTask } from "@/app/admin/(app)/tasks/actions";
import { SortableList } from "./admin/SortableList";
import { Field, btnCls, inputCls } from "./ui";

const PRIORITY = { 1: "High", 2: "", 3: "Low" } as Record<number, string>;

export function TaskList({
  tasks,
  showDelete = false,
  orders,
  reorderable = false,
}: {
  tasks: (Task & { order?: { id: string; code: string } | null; client?: { id: string; name: string } | null })[];
  showDelete?: boolean;
  /** When given, each task gets an Edit form (the order list feeds its Order field). */
  orders?: { id: string; code: string; title: string }[];
  reorderable?: boolean;
}) {
  const startOfToday = startOfDay(todayKey());
  const rows = tasks.map((t) => {
        const overdue = !t.done && t.dueDate && t.dueDate < startOfToday;
        return {
          id: t.id,
          node: (
          <div className="py-2">
            <div className="flex items-center gap-3">
            <form action={toggleTask.bind(null, t.id)}>
              <button
                aria-label={t.done ? "Mark not done" : "Mark done"}
                className={`flex h-7 w-7 items-center justify-center border ${t.done ? "border-olive bg-olive text-cream" : "border-oxblood"}`}
              >
                {t.done ? "✓" : ""}
              </button>
            </form>
            <div className="min-w-0 flex-1">
              <div className={`${t.done ? "text-ink-soft line-through" : ""}`}>
                {t.title}
                {PRIORITY[t.priority] && <span className={`ms-2 text-[11px] uppercase ${t.priority === 1 ? "text-burnt" : "text-ink-soft"}`}>{PRIORITY[t.priority]}</span>}
              </div>
              {t.notes && <div className="text-sm text-ink-soft whitespace-pre-line">{t.notes}</div>}
              <div className="text-xs text-ink-soft">
                {t.dueDate && <span className={overdue ? "text-burnt" : ""}>{overdue ? "Overdue · " : ""}{fmtDate(t.dueDate)}</span>}
                {t.recurrence && <span> · repeats {t.recurrence}</span>}
                {t.order && <> · <Link className="underline" href={`/admin/orders/${t.order.id}`}>{t.order.code}</Link></>}
                {t.client && <> · <Link className="underline" href={`/admin/clients/${t.client.id}`}>{t.client.name}</Link></>}
              </div>
            </div>
            {showDelete && (
              <form action={deleteTask.bind(null, t.id)}>
                <button className="min-h-11 px-3 text-lg text-ink-soft" aria-label="Delete task">×</button>
              </form>
            )}
            </div>
            {orders && (
              <details className="at-disclosure ms-10 mt-1">
                <summary>Edit</summary>
                <form action={updateTask.bind(null, t.id)} className="grid grid-cols-2 gap-2 md:grid-cols-6 md:items-end">
                  <div className="col-span-2"><Field label="Task"><input name="title" required defaultValue={t.title} className={inputCls} /></Field></div>
                  <Field label="Due"><input name="dueDate" type="date" defaultValue={toDateInput(t.dueDate)} className={inputCls} /></Field>
                  <Field label="Priority">
                    <select name="priority" defaultValue={String(t.priority)} className={inputCls}><option value="1">High</option><option value="2">Normal</option><option value="3">Low</option></select>
                  </Field>
                  <Field label="Repeats">
                    <select name="recurrence" defaultValue={t.recurrence ?? ""} className={inputCls}><option value="">Never</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
                  </Field>
                  <Field label="Order">
                    <select name="orderId" defaultValue={t.orderId ?? ""} className={inputCls}>
                      <option value="">None</option>
                      {orders.map((o) => <option key={o.id} value={o.id}>{o.code} {o.title}</option>)}
                      {t.order && !orders.some((o) => o.id === t.order!.id) && <option value={t.order.id}>{t.order.code}</option>}
                    </select>
                  </Field>
                  <div className="col-span-2 md:col-span-5"><Field label="Notes"><input name="notes" defaultValue={t.notes ?? ""} className={inputCls} /></Field></div>
                  <button className={btnCls}>Save</button>
                </form>
              </details>
            )}
          </div>
          ),
        };
      });

  // On the Tasks page (editable) the open lists can be dragged into any order.
  if (orders && reorderable) return <SortableList items={rows} onReorder={reorderTasks} />;
  return (
    <ul className="divide-y divide-olive/20">
      {rows.map((r) => <li key={r.id}>{r.node}</li>)}
    </ul>
  );
}
