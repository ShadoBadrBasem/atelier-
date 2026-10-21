import { AppointmentForm } from "@/components/AppointmentForm";
import { PageTitle, Panel } from "@/components/admin/kit";
import { createAppointment } from "../actions";

export default async function NewAppointment({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; clientId?: string; d?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="flex flex-col gap-5">
      <PageTitle eyebrow="Calendar" title="Schedule appointment" />
      <Panel>
      <AppointmentForm
        action={createAppointment}
        defaults={{ orderId: sp.orderId, clientId: sp.clientId, startsAt: sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? `${sp.d}T11:00` : undefined }}
      />
      </Panel>
    </main>
  );
}
