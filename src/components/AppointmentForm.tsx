import type { Appointment } from "@prisma/client";
import { db } from "@/lib/db";
import { APPOINTMENT_TYPES } from "@/lib/constants";
import { toInputValue } from "@/lib/cairo";
import { Field, btnCls, inputCls } from "./ui";

export async function AppointmentForm({
  action,
  appt,
  defaults = {},
}: {
  action: (fd: FormData) => Promise<void>;
  appt?: Appointment;
  defaults?: { clientId?: string; orderId?: string; startsAt?: string };
}) {
  const [clients, orders] = await Promise.all([
    db.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.order.findMany({ where: { stage: { not: "delivered" } }, orderBy: { code: "desc" }, select: { id: true, code: true, title: true, client: { select: { name: true } } } }),
  ]);
  const duration = appt ? Math.round((appt.endsAt.getTime() - appt.startsAt.getTime()) / 60_000) : 60;

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <Field label="Type">
        <select name="type" defaultValue={appt?.type ?? "consultation"} className={inputCls}>
          {APPOINTMENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </Field>
      <Field label="Order" hint="Choosing an order links its client automatically.">
        <select name="orderId" defaultValue={appt?.orderId ?? defaults.orderId ?? ""} className={inputCls}>
          <option value="">None</option>
          {orders.map((o) => <option key={o.id} value={o.id}>{o.code} · {o.client.name} · {o.title}</option>)}
        </select>
      </Field>
      <Field label="Client">
        <select name="clientId" defaultValue={appt?.clientId ?? defaults.clientId ?? ""} className={inputCls}>
          <option value="">None</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Starts (Cairo time)">
        <input name="startsAt" type="datetime-local" required defaultValue={appt ? toInputValue(appt.startsAt) : defaults.startsAt ?? ""} className={inputCls} />
      </Field>
      <Field label="Duration (minutes)">
        <input name="duration" type="number" min={15} max={480} step={15} defaultValue={duration} className={inputCls} />
      </Field>
      {appt && (
        <Field label="Status">
          <select name="status" defaultValue={appt.status} className={inputCls}>
            <option value="scheduled">Scheduled</option><option value="done">Done</option>
            <option value="cancelled">Cancelled</option><option value="no_show">No show</option>
          </select>
        </Field>
      )}
      <div className="md:col-span-2"><Field label="Notes"><textarea name="notes" rows={2} defaultValue={appt?.notes ?? ""} className={inputCls} /></Field></div>
      <div><button className={btnCls}>{appt ? "Save" : "Schedule"}</button></div>
    </form>
  );
}
