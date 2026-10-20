import Link from "next/link";
import type { Task } from "@prisma/client";
import { fmtDate, startOfDay, todayKey } from "@/lib/cairo";
import { deleteTask, toggleTask } from "@/app/admin/(app)/tasks/actions";

const PRIORITY = { 1: "High", 2: "", 3: "Low" } as Record<number, string>;

export function TaskList({
  tasks,
  showDelete = false,
}: {
  tasks: (Task & { order?: { id: string; code: string } | null; client?: { id: string; name: string } | null })[];
  showDelete?: boolean;
}) {
  const startOfToday = startOfDay(todayKey());
  return (
    <ul className="divide-y divide-olive/20">
      {tasks.map((t) => {
        const overdue = !t.done && t.dueDate && t.dueDate < startOfToday;
        return (
          <li key={t.id} className="flex items-center gap-3 py-2">
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
              <div className="text-xs text-ink-soft">
                {t.dueDate && <span className={overdue ? "text-burnt" : ""}>{overdue ? "Overdue · " : ""}{fmtDate(t.dueDate)}</span>}
                {t.recurrence && <span> · repeats {t.recurrence}</span>}
                {t.order && <> · <Link className="underline" href={`/admin/orders/${t.order.id}`}>{t.order.code}</Link></>}
                {t.client && <> · <Link className="underline" href={`/admin/clients/${t.client.id}`}>{t.client.name}</Link></>}
              </div>
            </div>
            {showDelete && (
              <form action={deleteTask.bind(null, t.id)}>
                <button className="px-2 text-ink-soft" aria-label="Delete task">×</button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
