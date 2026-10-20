import { ClientForm } from "@/components/ClientForm";
import { PageHeader } from "@/components/ui";
import { createClient } from "../actions";

export default function NewClient() {
  return (
    <main>
      <PageHeader title="New client" />
      <ClientForm action={createClient} submitLabel="Create client" />
    </main>
  );
}
