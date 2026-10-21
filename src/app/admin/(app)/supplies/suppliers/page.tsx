import Link from "next/link";
import type { Supplier } from "@prisma/client";
import { db } from "@/lib/db";
import { Field, btnCls, btnDangerCls, btnGhostCls, inputCls } from "@/components/ui";
import { Empty, PageTitle, Panel, initials } from "@/components/admin/kit";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SuppliesNav } from "@/components/admin/SuppliesNav";
import { normalizePhone } from "@/lib/form";
import { createSupplier, deleteSupplier, updateSupplier } from "../actions";

const mapsLink = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

function SupplierForm({ s, action, submitLabel }: { s?: Supplier; action: (fd: FormData) => Promise<void>; submitLabel: string }) {
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <Field label="Store name"><input name="name" required defaultValue={s?.name} placeholder="e.g. Al-Azhar Silks" className={inputCls} /></Field>
      <Field label="Contact person"><input name="contactName" defaultValue={s?.contactName ?? ""} placeholder="Who you ask for" className={inputCls} /></Field>
      <Field label="Phone / WhatsApp" hint="Egyptian 01… numbers work for WhatsApp too."><input name="phone" type="tel" defaultValue={s?.phone ?? ""} className={inputCls} /></Field>
      <Field label="Address"><input name="address" defaultValue={s?.address ?? ""} placeholder="Street, area, city" className={inputCls} /></Field>
      <div className="md:col-span-2"><Field label="Notes"><textarea name="notes" rows={2} defaultValue={s?.notes ?? ""} placeholder="Opening hours, what they're good for, prices…" className={inputCls} /></Field></div>
      <div><button className={btnCls}>{submitLabel}</button></div>
    </form>
  );
}

export default async function SuppliersPage() {
  const suppliers = await db.supplier.findMany({
    orderBy: { name: "asc" },
    include: { items: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
  });

  return (
    <main className="flex flex-col gap-5">
      <PageTitle eyebrow="Supplies & costs" title="Suppliers" sub={`${suppliers.length} store${suppliers.length === 1 ? "" : "s"}`} />
      <SuppliesNav current="suppliers" />

      {suppliers.length === 0 ? (
        <Panel><Empty>No suppliers yet. Add your first store below.</Empty></Panel>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {suppliers.map((s) => {
            const wa = normalizePhone(s.phone);
            return (
              <Panel key={s.id}>
                <div className="flex items-start gap-3">
                  <span className="at-avatar" aria-hidden>{initials(s.name)}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl leading-tight">{s.name}</h2>
                    {s.contactName && <p className="at-row-meta">Ask for {s.contactName}</p>}
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="at-eyebrow">Phone</dt>
                    <dd className="mt-1">{s.phone ? <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="underline underline-offset-4">{s.phone}</a> : <span className="at-muted">Not set</span>}</dd>
                  </div>
                  <div>
                    <dt className="at-eyebrow">Address</dt>
                    <dd className="mt-1">{s.address ?? <span className="at-muted">Not set</span>}</dd>
                  </div>
                  {s.items.length > 0 && (
                    <div>
                      <dt className="at-eyebrow">Supplies</dt>
                      <dd className="mt-1 flex flex-wrap gap-1.5">
                        {s.items.map((i) => <Link key={i.id} href={`/admin/supplies/${i.id}`} className="at-pill border border-oxblood/30">{i.name}</Link>)}
                      </dd>
                    </div>
                  )}
                  {s.notes && (
                    <div>
                      <dt className="at-eyebrow">Notes</dt>
                      <dd className="mt-1 whitespace-pre-line">{s.notes}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-[10px] bg-[#1f7a4d] px-4 text-xs uppercase tracking-[0.16em] text-white">WhatsApp</a>}
                  {s.phone && <a href={`tel:${s.phone.replace(/\s/g, "")}`} className={btnGhostCls}>Call</a>}
                  {s.address && <a href={mapsLink(s.address)} target="_blank" rel="noreferrer" className={btnGhostCls}>Directions</a>}
                </div>
                <details className="at-disclosure mt-3">
                  <summary>Edit</summary>
                  <SupplierForm s={s} action={updateSupplier.bind(null, s.id)} submitLabel="Save" />
                  <form action={deleteSupplier.bind(null, s.id)} className="mt-3">
                    <ConfirmButton message={`Delete ${s.name}? Its items stay, without a supplier.`} className={btnDangerCls}>Delete supplier</ConfirmButton>
                  </form>
                </details>
              </Panel>
            );
          })}
        </div>
      )}

      <Panel title="Add a supplier" eyebrow="New store">
        <SupplierForm action={createSupplier} submitLabel="Add supplier" />
      </Panel>
    </main>
  );
}
