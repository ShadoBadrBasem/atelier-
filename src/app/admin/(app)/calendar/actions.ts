"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { dayKey } from "@/lib/cairo";
import { int, optDate, optStr, str } from "@/lib/form";
import { APPOINTMENT_TYPES } from "@/lib/constants";

const types = APPOINTMENT_TYPES.map((t) => t.key) as [string, ...string[]];

async function read(fd: FormData) {
  const startsAt = optDate(fd, "startsAt");
  if (!startsAt) throw new Error("Choose a date and time");
  const minutes = Math.min(480, Math.max(15, int(fd, "duration", 60)));
  let clientId = optStr(fd, "clientId");
  const orderId = optStr(fd, "orderId");
  if (orderId) {
    const o = await db.order.findUniqueOrThrow({ where: { id: orderId }, select: { clientId: true } });
    clientId = o.clientId;
  }
  return {
    type: z.enum(types).parse(str(fd, "type")),
    startsAt,
    endsAt: new Date(startsAt.getTime() + minutes * 60_000),
    clientId,
    orderId,
    notes: optStr(fd, "notes"),
  };
}

export async function createAppointment(fd: FormData) {
  await requireUser();
  const data = await read(fd);
  await db.appointment.create({ data });
  revalidatePath("/admin");
  redirect(`/admin/calendar?view=day&d=${dayKey(data.startsAt)}`);
}

export async function updateAppointment(id: string, fd: FormData) {
  await requireUser();
  const data = await read(fd);
  await db.appointment.update({
    where: { id },
    data: { ...data, status: z.enum(["scheduled", "done", "cancelled", "no_show"]).parse(str(fd, "status")) },
  });
  revalidatePath("/admin");
  redirect(`/admin/calendar?view=day&d=${dayKey(data.startsAt)}`);
}

export async function deleteAppointment(id: string) {
  await requireUser();
  const a = await db.appointment.delete({ where: { id } });
  revalidatePath("/admin");
  redirect(`/admin/calendar?view=day&d=${dayKey(a.startsAt)}`);
}
