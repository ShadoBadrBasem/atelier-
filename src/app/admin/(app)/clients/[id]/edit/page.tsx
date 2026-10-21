import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ClientForm } from "@/components/ClientForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { btnDangerCls, btnGhostCls } from "@/components/ui";
import { PageTitle, Panel } from "@/components/admin/kit";
import { deleteClient, updateClient } from "../../actions";

export default async function EditClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await db.client.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } });
  if (!client) notFound();

  return (
    <main className="flex flex-col gap-5">
      <PageTitle
        eyebrow="Edit client"
        title={client.name}
        action={<Link href={`/admin/clients/${client.id}`} className={btnGhostCls}>Cancel</Link>}
      />
      <Panel title="Details">
        <ClientForm client={client} action={updateClient.bind(null, client.id)} submitLabel="Save changes" />
      </Panel>
      <Panel title="Delete client">
        {client._count.orders > 0 ? (
          <p className="at-muted text-sm">
            {client.name} has {client._count.orders} order{client._count.orders > 1 ? "s" : ""}, so she can&apos;t be deleted. Her history stays with her orders.
          </p>
        ) : (
          <form action={deleteClient.bind(null, client.id)} className="flex flex-wrap items-center gap-3">
            <p className="at-muted text-sm">Removes her details, measurements and files. This can&apos;t be undone.</p>
            <ConfirmButton message={`Delete ${client.name}? This can't be undone.`} className={btnDangerCls}>Delete client</ConfirmButton>
          </form>
        )}
      </Panel>
    </main>
  );
}
