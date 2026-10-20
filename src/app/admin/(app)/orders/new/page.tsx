import Link from "next/link";
import { db } from "@/lib/db";
import { Field, PageHeader, btnCls, inputCls } from "@/components/ui";
import { createOrder } from "../actions";

export default async function NewOrder({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const clients = await db.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <main>
      <PageHeader title="New order" />
      {clients.length === 0 ? (
        <p>
          Add a client first. <Link className="underline" href="/admin/clients/new">New client</Link>
        </p>
      ) : (
        <form action={createOrder} className="grid gap-3 md:grid-cols-2">
          <Field label="Client">
            <select name="clientId" required defaultValue={clientId ?? ""} className={inputCls}>
              <option value="" disabled>Choose…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Gown title">
            <input name="title" required placeholder="e.g. Ivory silk column, cathedral train" className={inputCls} />
          </Field>
          <Field label="Type">
            <select name="kind" className={inputCls}>
              <option value="bridal">Bridal</option>
              <option value="evening">Evening</option>
            </select>
          </Field>
          <Field label="Event date">
            <input name="eventDate" type="date" className={inputCls} />
          </Field>
          <Field label="List price (EGP)" hint="You can add discounts, deposit and due dates on the order.">
            <input name="listPrice" inputMode="decimal" className={inputCls} />
          </Field>
          <div className="md:col-span-2">
            <button className={btnCls}>Create order</button>
          </div>
        </form>
      )}
    </main>
  );
}
