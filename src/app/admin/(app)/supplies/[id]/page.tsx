import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge, Field, btnCls, btnDangerCls, btnGhostCls, inputCls } from "@/components/ui";
import { Empty, PageTitle, Panel, Stat, Stats } from "@/components/admin/kit";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ItemForm } from "@/components/admin/ItemForm";
import { fmtDate, toDateInput } from "@/lib/cairo";
import { formatEgp } from "@/lib/money";
import { STOCK_STATUS, inventoryLabel } from "@/lib/constants";
import { stockStatus, stockValue, suggestedReorder } from "@/lib/domain/inventory";
import { deleteItem, deletePurchase, recordPurchase, updateItem } from "../actions";

export default async function SupplyItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [item, suppliers] = await Promise.all([
    db.inventoryItem.findUnique({
      where: { id },
      include: {
        supplier: true,
        purchases: { orderBy: { purchasedAt: "desc" }, include: { supplier: { select: { name: true } }, expense: { select: { id: true } } } },
        usages: { orderBy: { usedAt: "desc" }, include: { order: { select: { id: true, code: true, title: true } } } },
      },
    }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!item) notFound();

  const status = stockStatus(item.stock, item.reorderLevel);
  const st = STOCK_STATUS[status];
  const reorder = suggestedReorder(item.stock, item.reorderLevel);
  const spent = item.purchases.reduce((s, p) => s + p.total, 0);

  return (
    <main className="flex flex-col gap-5">
      <PageTitle
        eyebrow={`Supplies · ${inventoryLabel(item.category)}`}
        title={item.name}
        sub={item.supplier ? `Supplier: ${item.supplier.name}${item.supplier.phone ? ` · ${item.supplier.phone}` : ""}` : "No supplier set"}
        action={<Link href="/admin/supplies" className={btnGhostCls}>All supplies</Link>}
      />
      {saved && <p role="status" className="at-callout">Changes saved.</p>}

      <Stats>
        <Stat label="In stock" value={`${item.stock} ${item.unit}`} hint={<Badge cls={st.cls}>{st.label}</Badge>} tone={status === "ok" ? "good" : "warn"} />
        <Stat label="Reorder at" value={`${item.reorderLevel} ${item.unit}`} hint={reorder ? `Buy about ${reorder} ${item.unit}` : "Nothing to buy yet"} tone="copper" />
        <Stat label="Price per unit" value={formatEgp(item.lastPrice)} hint={`Stock worth ${formatEgp(stockValue(item.stock, item.lastPrice))}`} tone="ox" />
        <Stat label="Spent on it" value={formatEgp(spent)} hint={`${item.purchases.length} purchase${item.purchases.length === 1 ? "" : "s"}`} />
      </Stats>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Record a purchase" eyebrow="Restock">
          <form action={recordPurchase.bind(null, item.id)} className="grid grid-cols-2 gap-3">
            <Field label={`Quantity (${item.unit})`}><input name="quantity" required inputMode="decimal" defaultValue={reorder || ""} className={inputCls} /></Field>
            <Field label="Price per unit (EGP)"><input name="unitPrice" required inputMode="decimal" defaultValue={item.lastPrice / 100 || ""} className={inputCls} /></Field>
            <Field label="Date"><input name="purchasedAt" type="date" defaultValue={toDateInput(new Date())} className={inputCls} /></Field>
            <Field label="Supplier">
              <select name="supplierId" defaultValue={item.supplierId ?? ""} className={inputCls}>
                <option value="">None</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <label className="col-span-2 flex items-center gap-3 text-sm">
              <input type="checkbox" name="logExpense" defaultChecked className="size-4 shrink-0 accent-[var(--oxblood)]" />
              <span>Add it to this month&apos;s costs</span>
            </label>
            <div className="col-span-2"><button className={btnCls}>Add to stock</button></div>
          </form>
        </Panel>

        <Panel title="Purchase history">
          {item.purchases.length === 0 ? <Empty>No purchases recorded yet.</Empty> : (
            <ul className="at-rows">
              {item.purchases.map((p) => (
                <li key={p.id} className="at-row">
                  <div>
                    <div className="text-sm">{fmtDate(p.purchasedAt)} · {p.quantity} {item.unit} × {formatEgp(p.unitPrice)}</div>
                    <div className="at-row-meta">{p.supplier?.name ?? "No supplier"}{p.expense ? " · in costs" : ""}</div>
                  </div>
                  <span className="flex items-center gap-2">
                    <span className="font-display tabular-nums">{formatEgp(p.total)}</span>
                    <form action={deletePurchase.bind(null, item.id, p.id)}>
                      <ConfirmButton message="Undo this purchase? Its stock and cost are removed." className={btnDangerCls}>×</ConfirmButton>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Edit item">
        <ItemForm item={item} suppliers={suppliers} action={updateItem.bind(null, item.id)} submitLabel="Save changes" />
      </Panel>

      <Panel title="Used on orders">
        {item.usages.length === 0 ? <Empty>Not used on any order yet. Add it from an order&apos;s Dress cost section.</Empty> : (
          <ul className="at-rows">
            {item.usages.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/orders/${u.order.id}`} className="at-row">
                  <div>
                    <div className="text-sm">{u.order.code} · {u.order.title}</div>
                    <div className="at-row-meta">{fmtDate(u.usedAt)} · {u.quantity} {item.unit} × {formatEgp(u.unitCost)}</div>
                  </div>
                  <span className="tabular-nums">{formatEgp(Math.round(u.quantity * u.unitCost))}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Delete item">
        {item.usages.length > 0 ? (
          <p className="at-muted text-sm">This item is used on orders, so it stays for their cost history. Set its stock to 0 instead.</p>
        ) : (
          <form action={deleteItem.bind(null, item.id)} className="flex flex-wrap items-center gap-3">
            <p className="at-muted text-sm">Removes the item and its purchase history.</p>
            <ConfirmButton message={`Delete ${item.name}?`} className={btnDangerCls}>Delete item</ConfirmButton>
          </form>
        )}
      </Panel>
    </main>
  );
}
