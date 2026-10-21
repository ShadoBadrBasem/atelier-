import { ClientForm } from "@/components/ClientForm";
import { PageTitle, Panel } from "@/components/admin/kit";
import { createClient } from "../actions";

export default function NewClient() {
  return (
    <main className="flex flex-col gap-5">
      <PageTitle eyebrow="Clients" title="New client" />
      <Panel>
        <ClientForm action={createClient} submitLabel="Create client" />
      </Panel>
    </main>
  );
}
