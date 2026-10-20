import { AppointmentForm } from "@/components/AppointmentForm";
import { PageHeader } from "@/components/ui";
import { createAppointment } from "../actions";

export default async function NewAppointment({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; clientId?: string; d?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main>
      <PageHeader title="Schedule appointment" />
      <AppointmentForm
        action={createAppointment}
        defaults={{ orderId: sp.orderId, clientId: sp.clientId, startsAt: sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? `${sp.d}T11:00` : undefined }}
      />
    </main>
  );
}
