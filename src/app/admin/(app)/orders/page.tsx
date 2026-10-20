import Link from "next/link";
import { Badge, Empty, PageHeader, btnCls } from "@/components/ui";
import { fmtDate } from "@/lib/cairo";
import { formatEgp } from "@/lib/money";
import { PAYMENT_STATUS_STYLE, STAGES, stageLabel } from "@/lib/constants";
import { ordersWithFinance } from "@/lib/orderQueries";

const DAY = 86_400_000;

function deadlineCls(eventDate: Date | null, stage: string) {
  if (!eventDate || stage === "delivered") return "";
  const days = (eventDate.getTime() - Date.now()) / DAY;
  if (days < 14) return "border-s-4 border-s-burnt";
  if (days < 45) return "border-s-4 border-s-copper";
  return "border-s-4 border-s-olive/50";
}

type Row = Awaited<ReturnType<typeof ordersWithFinance>>[number];

function OrderCard({ o }: { o: Row }) {
  const ps = PAYMENT_STATUS_STYLE[o.finance.status];
  return (
    <Link href={`/admin/orders/${o.id}`} className={`block bg-cream/70 p-3 shadow-sm ${deadlineCls(o.eventDate, o.stage)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-display text-base">{o.title}</div>
          <div className="text-xs text-ink-soft">{o.code} · {o.client.name}</div>
        </div>
        <Badge cls={ps.cls}>{ps.label}</Badge>
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink-soft">
        <span>{o.eventDate ? `Event ${fmtDate(o.eventDate)}` : "No event date"}</span>
        <span className="tabular-nums">{formatEgp(o.finance.balance)} due</span>
      </div>
    </Link>
  );
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view = "kanban" } = await searchParams;
  const orders = await ordersWithFinance();

  const tab = (v: string, label: string) => (
    <Link href={`?view=${v}`} className={`px-3 py-1.5 text-xs uppercase tracking-wider ${view === v ? "bg-oxblood text-cream" : "border border-olive/50"}`}>
      {label}
    </Link>
  );

  return (
    <main>
      <PageHeader title="Orders" action={<Link href="/admin/orders/new" className={btnCls}>New order</Link>} />
      <div className="mb-4 flex gap-2">{tab("kanban", "Board")}{tab("list", "List")}</div>

      {orders.length === 0 ? (
        <Empty>No orders yet.</Empty>
      ) : view === "list" ? (
        <ul className="flex flex-col gap-2">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-col gap-1">
              <OrderCard o={o} />
              <span className="ps-3 text-[11px] uppercase tracking-wider text-ink-soft">{stageLabel(o.stage)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4">
          {STAGES.map((s) => {
            const col = orders.filter((o) => o.stage === s.key);
            return (
              <section key={s.key} className="w-64 shrink-0 snap-start bg-sand/40 p-2">
                <h2 className="mb-2 flex justify-between px-1 text-xs uppercase tracking-[0.2em]">
                  {s.label}<span>{col.length}</span>
                </h2>
                <div className="flex flex-col gap-2">
                  {col.map((o) => <OrderCard key={o.id} o={o} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
