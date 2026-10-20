import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ClientForm } from "@/components/ClientForm";
import { Gallery } from "@/components/Gallery";
import { Badge, Card, Empty, Field, PageHeader, btnCls, btnGhostCls, inputCls } from "@/components/ui";
import { fmtDate, toDateInput } from "@/lib/cairo";
import { MEASUREMENT_FIELDS, stageLabel } from "@/lib/constants";
import { addMeasurement, updateClient } from "../actions";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await db.client.findUnique({
    where: { id },
    include: {
      measurements: { orderBy: { version: "desc" } },
      orders: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!client) notFound();
  const latest = client.measurements[0];
  const latestData = (latest?.data ?? {}) as Record<string, number>;

  return (
    <main className="flex flex-col gap-4">
      <PageHeader
        title={client.name}
        sub={[client.phone, client.eventDate && `Event ${fmtDate(client.eventDate)}`].filter(Boolean).join(" · ")}
        action={
          <Link href={`/admin/orders/new?clientId=${client.id}`} className={btnCls}>New order</Link>
        }
      />

      <Card title="Orders">
        {client.orders.length === 0 ? (
          <Empty>No orders yet.</Empty>
        ) : (
          <ul className="divide-y divide-olive/30">
            {client.orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between py-2">
                  <span>{o.code} · {o.title}</span>
                  <Badge>{stageLabel(o.stage)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Details">
        <ClientForm client={client} action={updateClient.bind(null, client.id)} submitLabel="Save" />
      </Card>

      <Card title="Measurements" action={latest && <span className="text-sm text-ink-soft">v{latest.version} · {fmtDate(latest.takenAt)}</span>}>
        <p className="mb-3 text-sm text-ink-soft">
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
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-start text-xs uppercase tracking-wider text-ink-soft">
                  <th className="py-1 text-start">Version</th>
                  {MEASUREMENT_FIELDS.map((f) => <th key={f} className="px-1 text-start">{f}</th>)}
                </tr>
              </thead>
              <tbody>
                {client.measurements.map((m) => {
                  const d = m.data as Record<string, number>;
                  return (
                    <tr key={m.id} className="border-t border-olive/20">
                      <td className="py-1">v{m.version} · {fmtDate(m.takenAt)}</td>
                      {MEASUREMENT_FIELDS.map((f) => <td key={f} className="px-1 tabular-nums">{d[f] ?? ""}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Inspiration & files">
        <Gallery clientId={client.id} defaultCategory="inspiration" />
      </Card>
    </main>
  );
}
