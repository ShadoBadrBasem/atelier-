import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppointmentForm } from "@/components/AppointmentForm";
import { PageHeader, btnDangerCls } from "@/components/ui";
import { apptLabel } from "@/lib/constants";
import { fmtDateTime } from "@/lib/cairo";
import { deleteAppointment, updateAppointment } from "../actions";

export default async function EditAppointment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appt = await db.appointment.findUnique({ where: { id }, include: { client: true } });
  if (!appt) notFound();
  return (
    <main className="flex flex-col gap-4">
      <PageHeader title={apptLabel(appt.type)} sub={`${appt.client?.name ?? "No client"} · ${fmtDateTime(appt.startsAt)}`} />
      <AppointmentForm action={updateAppointment.bind(null, appt.id)} appt={appt} />
      <form action={deleteAppointment.bind(null, appt.id)}>
        <button className={btnDangerCls}>Delete appointment</button>
      </form>
    </main>
  );
}
