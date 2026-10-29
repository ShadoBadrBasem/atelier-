import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, btnCls, inputCls } from "@/components/ui";
import { Empty, PageTitle, Panel, Tabs, initials } from "@/components/admin/kit";
import { fmtDate } from "@/lib/cairo";
import { formatEgp } from "@/lib/money";
import { financeInclude } from "@/lib/orderQueries";
import { orderFinance } from "@/lib/domain/orderFinance";
import { clientAccount, discountLabel } from "@/lib/domain/clientAccount";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const { q, view } = await searchParams;
  const all = await db.client.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] } : undefined,
    orderBy: { createdAt: "desc" },
    include: { orders: { include: financeInclude } },
  });
  const now = new Date();
  // A client moves to "Past" once every one of her orders is delivered; she is never deleted.
  const isPast = (c: (typeof all)[number]) => c.orders.length > 0 && c.orders.every((o) => o.stage === "delivered");
  const past = all.filter(isPast);
  const current = all.filter((c) => !isPast(c));
  const showPast = view === "past";
  const clients = q ? all : showPast ? past : current;
  const tab = (v: string, label: string, n: number) => ({ key: v, label: `${label} (${n})`, href: `/admin/clients${v === "past" ? "?view=past" : ""}` });

  return (
    <main className="flex flex-col gap-5">
      <PageTitle
        eyebrow="The Atelier"
        title="Clients"
        sub={q ? `${clients.length} matching “${q}”` : `${current.length} current · ${past.length} past`}
        action={<Link href="/admin/clients/new" className={btnCls}>New client</Link>}
      />
      {!q && <div><Tabs current={showPast ? "past" : "current"} items={[tab("current", "Current", current.length), tab("past", "Past", past.length)]} /></div>}
      <form>
        <input name="q" defaultValue={q} placeholder="Search name or phone" className={inputCls} aria-label="Search clients" />
      </form>
      <Panel>
        {clients.length === 0 ? (
          <Empty>{q ? "No client matches that search." : showPast ? "No past clients yet. Clients move here once all their orders are delivered." : "No current clients."}</Empty>
        ) : (
          <ul className="at-rows">
            {clients.map((c) => {
              const acct = clientAccount(c.orders.map((o) => ({ ...o, finance: orderFinance(o, now) })));
              const disc = discountLabel(c, formatEgp);
              return (
                <li key={c.id}>
                  <Link href={`/admin/clients/${c.id}`} className="at-row">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="at-avatar" aria-hidden>{initials(c.name)}</span>
                      <div className="min-w-0">
                        <div className="at-row-title truncate">{c.name}</div>
                        <div className="at-row-meta">
                          {c.phone ?? "No phone"}
                          {c.eventDate ? ` · event ${fmtDate(c.eventDate)}` : ""}
                          {` · ${c.orders.length} order${c.orders.length === 1 ? "" : "s"}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {acct.balance > 0 && <span className="text-sm tabular-nums">{formatEgp(acct.balance)} due</span>}
                      <div className="flex flex-wrap justify-end gap-1">
                        {acct.depositOutstanding > 0 && <Badge cls="bg-copper/30 text-oxblood">Deposit owed</Badge>}
                        {disc && <Badge cls="bg-oxblood text-cream">{disc.replace(" per order", "")}</Badge>}
                        {c.eventType && <Badge>{c.eventType}</Badge>}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </main>
  );
}
