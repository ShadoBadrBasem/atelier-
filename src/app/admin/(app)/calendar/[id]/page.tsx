import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppointmentForm } from "@/components/AppointmentForm";
import { btnDangerCls } from "@/components/ui";
import { apptLabel } from "@/lib/constants";
import { fmtDateTime } from "@/lib/cairo";
import { deleteAppointment, updateAppointment } from "../actions";
import Link from "next/link";
import { PageTitle, Panel } from "@/components/admin/kit";
import { WhatsAppSend } from "@/components/admin/WhatsAppSend";
import { composeAppointment } from "@/lib/whatsapp/compose";
import { loadOverrides } from "@/lib/whatsapp/overrides";
import { templateLabel } from "@/lib/whatsapp/templates";

export default async function EditAppointment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appt = await db.appointment.findUnique({ where: { id }, include: { client: true } });
  if (!appt) notFound();
  const options = appt.client
    ? composeAppointment(appt, appt.client, await loadOverrides()).map((m) => ({ key: m.key, label: templateLabel(m.key), body: m.body, orderId: appt.orderId }))
    : [];
  return (
    <main className="flex flex-col gap-5">
      <PageTitle eyebrow="Appointment" title={apptLabel(appt.type)} sub={`${appt.client?.name ?? "No client"} · ${fmtDateTime(appt.startsAt)}`} />
      {appt.client && (
        <Panel title="Send on WhatsApp" eyebrow="Confirm or remind" action={<Link href="/admin/settings/messages" className="text-sm underline underline-offset-4">Edit wording</Link>}>
          {appt.client.whatsapp ? (
            <WhatsAppSend to={appt.client.whatsapp} clientId={appt.client.id} options={options} rtl={appt.client.language === "ar"} />
          ) : (
            <p className="at-muted text-sm">Add {appt.client.name}&apos;s WhatsApp number to send messages. <Link href={`/admin/clients/${appt.client.id}/edit`} className="underline">Edit client</Link></p>
          )}
        </Panel>
      )}
      <Panel title="Details">
        <AppointmentForm action={updateAppointment.bind(null, appt.id)} appt={appt} />
      </Panel>
      <form action={deleteAppointment.bind(null, appt.id)}>
        <button className={btnDangerCls}>Delete appointment</button>
      </form>
    </main>
  );
}
