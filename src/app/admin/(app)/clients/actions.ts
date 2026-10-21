"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { MEASUREMENT_FIELDS, PAYMENT_METHODS } from "@/lib/constants";
import { money, normalizePhone, optDate, optStr, str } from "@/lib/form";
import { readDiscount } from "@/lib/discountForm";
import { finalPrice } from "@/lib/domain/pricing";

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

/** Saves the client's standing discount. New orders copy it; optionally re-price her open orders too. */
export async function saveClientDiscount(clientId: string, fd: FormData) {
  await requireUser();
  const discount = readDiscount(fd);
  const applyToOpen = fd.get("applyToOpen") === "on";

  await db.$transaction(async (tx) => {
    await tx.client.update({ where: { id: clientId }, data: discount });
    if (!applyToOpen) return;
    const open = await tx.order.findMany({
      where: { clientId, stage: { not: "delivered" } },
      select: { id: true, listPrice: true },
    });
    for (const o of open) {
      await tx.order.update({
        where: { id: o.id },
        data: { ...discount, finalPrice: finalPrice({ listPrice: o.listPrice, ...discount }) },
      });
    }
  });
  revalidatePath(`/admin/clients/${clientId}`);
}

/** Records a deposit payment against one of the client's orders. */
export async function recordDeposit(clientId: string, fd: FormData) {
  await requireUser();
  const orderId = z.string().min(1, "Choose an order").parse(str(fd, "orderId"));
  const amount = money(fd, "amount");
  if (amount <= 0) throw new Error("Amount must be above zero");
  // Guard: the order must belong to this client.
  await db.order.findFirstOrThrow({ where: { id: orderId, clientId }, select: { id: true } });
  await db.payment.create({
    data: {
      orderId,
      amount,
      isDeposit: true,
      paidAt: optDate(fd, "paidAt") ?? new Date(),
      method: z.enum(PAYMENT_METHODS.map((m) => m.key) as [string, ...string[]]).parse(str(fd, "method")),
      note: optStr(fd, "note"),
    },
  });
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath(`/admin/orders/${orderId}`);
}

/** Sets the deposit required on one order from the client page. */
export async function setDepositRequired(clientId: string, orderId: string, fd: FormData) {
  await requireUser();
  await db.order.update({
    where: { id: orderId, clientId },
    data: { depositAmount: money(fd, "depositAmount"), depositDueDate: optDate(fd, "depositDueDate") },
  });
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath(`/admin/orders/${orderId}`);
}
