import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, Empty, PageHeader, btnCls, inputCls } from "@/components/ui";
import { fmtDate } from "@/lib/cairo";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await db.client.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <main>
      <PageHeader
        title="Clients"
        action={<Link href="/admin/clients/new" className={btnCls}>New client</Link>}
      />
      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search name or phone" className={inputCls} />
      </form>
      {clients.length === 0 ? (
        <Empty>No clients yet.</Empty>
      ) : (
        <ul className="divide-y divide-olive/30 border-y border-olive/30">
          {clients.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/clients/${c.id}`} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-display text-lg">{c.name}</div>
                  <div className="text-sm text-ink-soft">
                    {c.phone ?? "No phone"}
                    {c.eventDate ? ` · event ${fmtDate(c.eventDate)}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.eventType && <Badge>{c.eventType}</Badge>}
                  <span className="text-sm text-ink-soft">{c._count.orders} orders</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
