import { db } from "@/lib/db";
import { Field, btnCls, btnDangerCls, btnGhostCls, inputCls } from "@/components/ui";
import { Empty, PageTitle, Panel } from "@/components/admin/kit";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SuppliesNav } from "@/components/admin/SuppliesNav";
import { normalizePhone } from "@/lib/form";
import { createSupplier, deleteSupplier, updateSupplier } from "../actions";

export default async function SuppliersPage() {
  const suppliers = await db.supplier.findMany({
    orderBy: { name: "asc" },
    include: { items: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
  });

  return (
    <main className="flex flex-col gap-5">
      <PageTitle eyebrow="Supplies & costs" title="Suppliers" sub={`${suppliers.length} supplier${suppliers.length === 1 ? "" : "s"}`} />
      <SuppliesNav current="suppliers" />

      <Panel title="Your suppliers">
        {suppliers.length === 0 ? <Empty>No suppliers yet. Add one below.</Empty> : (
          <ul className="at-rows">
            {suppliers.map((s) => {
              const wa = normalizePhone(s.phone);
              return (
                <li key={s.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="at-row-title">{s.name}</div>
                      <div className="at-row-meta">
                        {s.phone ?? "No phone"}
                        {s.items.length > 0 && ` · supplies ${s.items.map((i) => i.name).join(", ")}`}
                      </div>
                      {s.notes && <p className="at-muted mt-1 text-sm">{s.notes}</p>}
                    </div>
                    {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className={btnGhostCls}>WhatsApp</a>}
                  </div>
                  <details className="at-disclosure mt-2">
                    <summary>Edit</summary>
                    <form action={updateSupplier.bind(null, s.id)} className="grid gap-3 md:grid-cols-[1fr_12rem_1fr_auto] md:items-end">
                      <Field label="Name"><input name="name" required defaultValue={s.name} className={inputCls} /></Field>
                      <Field label="Phone"><input name="phone" type="tel" defaultValue={s.phone ?? ""} className={inputCls} /></Field>
                      <Field label="Notes"><input name="notes" defaultValue={s.notes ?? ""} className={inputCls} /></Field>
                      <button className={btnCls}>Save</button>
                    </form>
                    <form action={deleteSupplier.bind(null, s.id)} className="mt-3">
                      <ConfirmButton message={`Delete ${s.name}? Items stay, without a supplier.`} className={btnDangerCls}>Delete supplier</ConfirmButton>
                    </form>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Add a supplier" eyebrow="New">
        <form action={createSupplier} className="grid gap-3 md:grid-cols-[1fr_12rem_1fr_auto] md:items-end">
          <Field label="Name"><input name="name" required className={inputCls} /></Field>
          <Field label="Phone"><input name="phone" type="tel" className={inputCls} /></Field>
          <Field label="Notes"><input name="notes" placeholder="e.g. Silk from Al-Azhar street" className={inputCls} /></Field>
          <button className={btnCls}>Add supplier</button>
        </form>
      </Panel>
    </main>
  );
}
