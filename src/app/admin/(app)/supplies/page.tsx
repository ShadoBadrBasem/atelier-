import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { Empty, Meter, PageTitle, Panel, Stat, Stats } from "@/components/admin/kit";
import { ItemForm } from "@/components/admin/ItemForm";
import { SuppliesNav } from "@/components/admin/SuppliesNav";
import { formatEgp } from "@/lib/money";
import { INVENTORY_CATEGORIES, STOCK_STATUS, inventoryLabel } from "@/lib/constants";
import { stockStatus, stockValue, suggestedReorder } from "@/lib/domain/inventory";
import { createItem } from "./actions";

export default async function SuppliesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; low?: string; q?: string }>;
}) {
  const { cat, low, q } = await searchParams;
  const [all, suppliers] = await Promise.all([
    db.inventoryItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }], include: { supplier: { select: { name: true } } } }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const rows = all.map((i) => ({ ...i, status: stockStatus(i.stock, i.reorderLevel), value: stockValue(i.stock, i.lastPrice) }));
  const needReorder = rows.filter((r) => r.status !== "ok");
  const shown = rows.filter(
    (r) => (!cat || r.category === cat) && (!low || r.status !== "ok") && (!q || r.name.toLowerCase().includes(q.toLowerCase())),
  );
  const qs = (patch: Record<string, string | undefined>) => {
    const entries = Object.entries({ cat, low, q, ...patch }).filter((e): e is [string, string] => !!e[1]);
    const p = new URLSearchParams(entries);
    return `/admin/supplies${entries.length ? `?${p}` : ""}`;
  };
  const chip = (active: boolean) => `at-pill min-h-9 ${active ? "bg-oxblood text-cream" : "border border-oxblood/40 text-oxblood"}`;

  return (
    <main className="flex flex-col gap-5">
      <PageTitle eyebrow="Supplies & costs" title="Stock" sub={`${rows.length} item${rows.length === 1 ? "" : "s"} tracked`} />
      <SuppliesNav current="stock" />

      <Stats>
        <Stat label="Items" value={rows.length} tone="ox" />
        <Stat
          label="Need reordering"
          value={needReorder.length}
          hint={needReorder.length ? needReorder.slice(0, 3).map((r) => r.name).join(", ") : "All stocked"}
          tone={needReorder.length ? "warn" : "good"}
        />
        <Stat label="Stock value" value={formatEgp(rows.reduce((s, r) => s + r.value, 0))} hint="at last purchase prices" tone="copper" />
        <Stat label="Suppliers" value={suppliers.length} tone="good" />
      </Stats>

      {needReorder.length > 0 && (
        <Panel title="Reorder list" eyebrow="Running low">
          <ul className="at-rows">
            {needReorder.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/supplies/${r.id}`} className="at-row">
                  <div className="min-w-0">
                    <div className="at-row-title">{r.name}</div>
                    <div className="at-row-meta">
                      {r.stock} {r.unit} left · reorder at {r.reorderLevel} · buy about {suggestedReorder(r.stock, r.reorderLevel)} {r.unit}
                      {r.supplier ? ` from ${r.supplier.name}` : ""}
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-sm tabular-nums sm:inline">{formatEgp(r.lastPrice)} / {r.unit}</span>
                    <Badge cls={STOCK_STATUS[r.status].cls}>{STOCK_STATUS[r.status].label}</Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="All supplies">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link href={qs({ cat: undefined })} className={chip(!cat)}>All</Link>
          {INVENTORY_CATEGORIES.map((c) => (
            <Link key={c.key} href={qs({ cat: c.key })} className={chip(cat === c.key)}>{c.label}</Link>
          ))}
          <Link href={qs({ low: low ? undefined : "1" })} className={`at-pill min-h-9 ${low ? "bg-burnt text-cream" : "border border-burnt/60 text-burnt"}`}>Low only</Link>
          <form action="/admin/supplies" className="w-full sm:ms-auto sm:w-56">
            {cat && <input type="hidden" name="cat" value={cat} />}
            {low && <input type="hidden" name="low" value={low} />}
            <input name="q" defaultValue={q} placeholder="Search supplies" aria-label="Search supplies" className="min-h-11 w-full border border-olive/50 bg-cream/60 px-3" />
          </form>
        </div>
        {shown.length === 0 ? (
          <Empty>{rows.length ? "Nothing matches this filter." : "No supplies yet. Add your first item below."}</Empty>
        ) : (
          <div className="-mx-1 overflow-x-auto">
            <table className="at-table min-w-[720px]">
              <thead>
                <tr><th>Item</th><th>In stock</th><th className="num">Reorder at</th><th className="num">Price / unit</th><th className="num">Value</th><th>Supplier</th><th /></tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/supplies/${r.id}`} className="font-display text-base underline-offset-4 hover:underline">{r.name}</Link>
                      <div className="at-row-meta">{inventoryLabel(r.category)}</div>
                    </td>
                    <td className="min-w-32">
                      <div className="mb-1 text-sm">{r.stock} {r.unit}</div>
                      <Meter value={r.reorderLevel > 0 ? r.stock / (r.reorderLevel * 2) : 1} warn={r.status !== "ok"} />
                    </td>
                    <td className="num">{r.reorderLevel} {r.unit}</td>
                    <td className="num">{formatEgp(r.lastPrice)}</td>
                    <td className="num">{formatEgp(r.value)}</td>
                    <td className="text-sm">{r.supplier?.name ?? <span className="at-muted">—</span>}</td>
                    <td><Link href={`/admin/supplies/${r.id}`}><Badge cls={STOCK_STATUS[r.status].cls}>{STOCK_STATUS[r.status].label}</Badge></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Add a supply" eyebrow="New item">
        <ItemForm suppliers={suppliers} action={createItem} submitLabel="Add item" />
      </Panel>
    </main>
  );
}
