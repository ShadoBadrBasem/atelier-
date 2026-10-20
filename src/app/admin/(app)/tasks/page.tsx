import { db } from "@/lib/db";
import { Card, Empty, Field, PageHeader, btnCls, inputCls } from "@/components/ui";
import { TaskList } from "@/components/TaskList";
import { addDaysKey, startOfDay, todayKey } from "@/lib/cairo";
import { createTask } from "./actions";

const include = { order: { select: { id: true, code: true } }, client: { select: { id: true, name: true } } };

export default async function TasksPage() {
  const tomorrow = startOfDay(addDaysKey(todayKey(), 1));
  const [open, done, orders] = await Promise.all([
    db.task.findMany({ where: { done: false }, orderBy: [{ dueDate: "asc" }, { priority: "asc" }], include }),
    db.task.findMany({ where: { done: true }, orderBy: { doneAt: "desc" }, take: 15, include }),
    db.order.findMany({ where: { stage: { not: "delivered" } }, select: { id: true, code: true, title: true }, orderBy: { code: "desc" } }),
  ]);
  // Overdue tasks carry over into Today automatically.
  const todayList = open.filter((t) => t.dueDate && t.dueDate < tomorrow);
  const upcoming = open.filter((t) => t.dueDate && t.dueDate >= tomorrow);
  const someday = open.filter((t) => !t.dueDate);

  return (
    <main className="flex flex-col gap-4">
      <PageHeader title="Tasks" sub={`${todayList.length} for today`} />
      <Card title="Add a task">
        <form action={createTask} className="grid grid-cols-2 gap-2 md:grid-cols-6 md:items-end">
          <div className="col-span-2"><Field label="Task"><input name="title" required className={inputCls} /></Field></div>
          <Field label="Due"><input name="dueDate" type="date" defaultValue={todayKey()} className={inputCls} /></Field>
          <Field label="Priority">
            <select name="priority" defaultValue="2" className={inputCls}><option value="1">High</option><option value="2">Normal</option><option value="3">Low</option></select>
          </Field>
          <Field label="Repeats">
            <select name="recurrence" className={inputCls}><option value="">Never</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
          </Field>
          <Field label="Order">
            <select name="orderId" className={inputCls}><option value="">None</option>{orders.map((o) => <option key={o.id} value={o.id}>{o.code} {o.title}</option>)}</select>
          </Field>
          <div className="col-span-2 md:col-span-6"><button className={btnCls}>Add</button></div>
        </form>
      </Card>
      <Card title="Today">{todayList.length ? <TaskList tasks={todayList} showDelete /> : <Empty>Nothing due today.</Empty>}</Card>
      <Card title="Upcoming">{upcoming.length ? <TaskList tasks={upcoming} showDelete /> : <Empty>Nothing scheduled.</Empty>}</Card>
      {someday.length > 0 && <Card title="No date"><TaskList tasks={someday} showDelete /></Card>}
      {done.length > 0 && <Card title="Recently done"><TaskList tasks={done} /></Card>}
    </main>
  );
}
