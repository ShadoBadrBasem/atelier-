import type { InventoryItem, Supplier } from "@prisma/client";
import { Field, btnCls, inputCls } from "@/components/ui";
import { INVENTORY_CATEGORIES, UNITS } from "@/lib/constants";

/** Create or edit a supply item. Prices in EGP per unit. */
export function ItemForm({
  item,
  suppliers,
  action,
  submitLabel,
}: {
  item?: InventoryItem;
  suppliers: Pick<Supplier, "id" | "name">[];
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="col-span-2">
        <Field label="Name"><input name="name" required defaultValue={item?.name} placeholder="e.g. Ivory silk crepe" className={inputCls} /></Field>
      </div>
      <Field label="Category">
        <select name="category" defaultValue={item?.category ?? "fabric"} className={inputCls}>
          {INVENTORY_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="Unit">
        <input name="unit" required list="units" defaultValue={item?.unit ?? "m"} className={inputCls} />
        <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
      </Field>
      <Field label="In stock" hint={item ? "Correct this after a stock count." : undefined}>
        <input name="stock" inputMode="decimal" defaultValue={item?.stock ?? ""} placeholder="0" className={inputCls} />
      </Field>
      <Field label="Reorder at" hint="You are warned at or below this.">
        <input name="reorderLevel" inputMode="decimal" defaultValue={item?.reorderLevel ?? ""} placeholder="0" className={inputCls} />
      </Field>
      <Field label="Price per unit (EGP)">
        <input name="lastPrice" inputMode="decimal" defaultValue={item ? item.lastPrice / 100 : ""} className={inputCls} />
      </Field>
      <Field label="Supplier">
        <select name="supplierId" defaultValue={item?.supplierId ?? ""} className={inputCls}>
          <option value="">None</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div className="col-span-2 md:col-span-4"><button className={btnCls}>{submitLabel}</button></div>
    </form>
  );
}
