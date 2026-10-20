"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { MEASUREMENT_FIELDS } from "@/lib/constants";
import { normalizePhone, optDate, optStr, str } from "@/lib/form";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  language: z.enum(["en", "ar"]),
  eventType: z.enum(["bridal", "evening"]).nullable(),
});

function readClient(fd: FormData) {
  const parsed = clientSchema.parse({
    name: str(fd, "name"),
    language: str(fd, "language") || "en",
    eventType: optStr(fd, "eventType"),
  });
  const phone = optStr(fd, "phone");
  return {
    ...parsed,
    phone,
    whatsapp: normalizePhone(optStr(fd, "whatsapp") ?? phone),
    email: optStr(fd, "email"),
    notes: optStr(fd, "notes"),
    eventDate: optDate(fd, "eventDate"),
  };
}

export async function createClient(fd: FormData) {
  await requireUser();
  const c = await db.client.create({ data: readClient(fd) });
  redirect(`/admin/clients/${c.id}`);
}

export async function updateClient(id: string, fd: FormData) {
  await requireUser();
  await db.client.update({ where: { id }, data: readClient(fd) });
  revalidatePath(`/admin/clients/${id}`);
}

/** Append-only: every save creates the next version, nothing is overwritten. */
export async function addMeasurement(clientId: string, fd: FormData) {
  await requireUser();
  const data: Record<string, number> = {};
  for (const f of MEASUREMENT_FIELDS) {
    const raw = str(fd, f).replace(",", ".");
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0 || n > 400) throw new Error(`Invalid ${f}`);
    data[f] = n;
  }
  if (Object.keys(data).length === 0) return;

  const last = await db.measurement.findFirst({
    where: { clientId },
    orderBy: { version: "desc" },
  });
  await db.measurement.create({
    data: {
      clientId,
      version: (last?.version ?? 0) + 1,
      takenAt: optDate(fd, "takenAt") ?? new Date(),
      notes: optStr(fd, "notes"),
      data,
    },
  });
  revalidatePath(`/admin/clients/${clientId}`);
}
