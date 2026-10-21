import Link from "next/link";
import { Badge, btnCls } from "@/components/ui";
import { Empty, PageTitle, PhasePill, Tabs, initials } from "@/components/admin/kit";
import { fmtDate } from "@/lib/cairo";
import { formatEgp } from "@/lib/money";
import { PAYMENT_STATUS_STYLE, STAGES, stageLabel } from "@/lib/constants";
import { stageColor } from "@/lib/phaseColors";
import { ordersWithFinance } from "@/lib/orderQueries";

const DAY = 86_400_000;

function countdown(eventDate: Date | null, stage: string) {
  if (!eventDate || stage === "delivered") return null;
  const days = Math.ceil((eventDate.getTime() - Date.now()) / DAY);
  const text = days < 0 ? `${-days}d past event` : days === 0 ? "Event today" : `${days}d to event`;
  return { text, cls: days < 14 ? "is-soon" : days < 45 ? "is-near" : "" };
}

type Row = Awaited<ReturnType<typeof ordersWithFinance>>[number];

function OrderCard({ o, showStage }: { o: Row; showStage?: boolean }) {
  const ps = PAYMENT_STATUS_STYLE[o.finance.status];
  const color = stageColor(o.stage);
  const idx = STAGES.findIndex((s) => s.key === o.stage);
  const due = countdown(o.eventDate, o.stage);
  return (
    <Link href={`/admin/orders/${o.id}`} className="ob-card" style={{ ["--stage" as string]: color.bg }}>
      <div className="ob-card-top">
        <span className="at-avatar" aria-hidden>{initials(o.client.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="ob-card-title">{o.title}</div>
          <div className="at-row-meta">{o.code} · {o.client.name}</div>
        </div>
        {showStage && <PhasePill color={color}>{stageLabel(o.stage)}</PhasePill>}
      </div>
      <div className="ob-steps" aria-label={`Stage ${idx + 1} of ${STAGES.length}: ${stageLabel(o.stage)}`}>
        {STAGES.map((s, i) => (
          <span key={s.key} style={i <= idx ? { background: stageColor(s.key).bg } : undefined} />
        ))}
      </div>
      <div className="ob-foot">
        <Badge cls={ps.cls}>{ps.label}</Badge>
        <span className="tabular-nums">{o.finance.balance > 0 ? `${formatEgp(o.finance.balance)} due` : "Settled"}</span>
      </div>
      <div className="ob-foot">
        <span>{o.eventDate ? fmtDate(o.eventDate) : "No event date"}</span>
        {due && <span className={`ob-due ${due.cls}`}>{due.text}</span>}
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
  const byStage = new Map(STAGES.map((s) => [s.key as string, orders.filter((o) => o.stage === s.key)]));
  const inProgress = orders.filter((o) => o.stage !== "delivered").length;

  return (
    <main className="flex flex-col gap-5">
      <PageTitle
        eyebrow="The Atelier"
        title="Orders"
        sub={`${inProgress} in progress · ${orders.length - inProgress} delivered`}
        action={<Link href="/admin/orders/new" className={btnCls}>New order</Link>}
      />

      {/* Pipeline: one coloured tile per stage with its count. */}
      <nav className="ob-pipeline" aria-label="Orders per stage">
        {STAGES.map((s) => {
          const n = byStage.get(s.key)!.length;
          const c = stageColor(s.key);
          return (
            <a key={s.key} href={`#stage-${s.key}`} className={n ? "" : "is-empty"} style={{ background: c.bg, color: c.fg }}>
              <b>{n}</b>{s.label}
            </a>
          );
        })}
      </nav>

      <div>
        <Tabs current={view} items={[{ key: "kanban", label: "Board", href: "?view=kanban" }, { key: "list", label: "List", href: "?view=list" }]} />
      </div>

      {orders.length === 0 ? (
        <Empty>No orders yet.</Empty>
      ) : view === "list" ? (
        <div className="ob-list">
          {orders.map((o) => <OrderCard key={o.id} o={o} showStage />)}
        </div>
      ) : (
        <div className="ob-board">
          {STAGES.map((s) => {
            const col = byStage.get(s.key)!;
            return (
              <section key={s.key} id={`stage-${s.key}`} className={`ob-col ${col.length ? "" : "is-empty"}`} aria-label={s.label}>
                <div className="ob-col-head">
                  <PhasePill color={stageColor(s.key)}>{s.label}</PhasePill>
                  {col.length > 0 && <span className="at-muted text-sm tabular-nums">{col.length}</span>}
                </div>
                {col.map((o) => <OrderCard key={o.id} o={o} />)}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
