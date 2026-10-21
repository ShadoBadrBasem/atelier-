import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, btnCls, inputCls } from "@/components/ui";
import { Empty, PageTitle, Panel, initials } from "@/components/admin/kit";
import { fmtDate } from "@/lib/cairo";
import { formatEgp } from "@/lib/money";
import { financeInclude } from "@/lib/orderQueries";
import { orderFinance } from "@/lib/domain/orderFinance";
import { clientAccount, discountLabel } from "@/lib/domain/clientAccount";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await db.client.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] } : undefined,
    orderBy: { createdAt: "desc" },
    include: { orders: { include: financeInclude } },
  });
  const now = new Date();

  return (
    <main className="flex flex-col gap-5">
      <PageTitle
        eyebrow="The Atelier"
        title="Clients"
        sub={`${clients.length} ${clients.length === 1 ? "client" : "clients"}${q ? ` matching “${q}”` : ""}`}
        action={<Link href="/admin/clients/new" className={btnCls}>New client</Link>}
      />
      <form>
        <input name="q" defaultValue={q} placeholder="Search name or phone" className={inputCls} aria-label="Search clients" />
      </form>
      <Panel>
        {clients.length === 0 ? (
          <Empty>{q ? "No client matches that search." : "No clients yet."}</Empty>
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
