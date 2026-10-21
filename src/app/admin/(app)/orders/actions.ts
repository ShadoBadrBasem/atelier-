"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { money, optDate, optStr, qty, str } from "@/lib/form";
import { roundQty } from "@/lib/domain/inventory";
import { finalPrice, type DiscountKind, type DiscountMode } from "@/lib/domain/pricing";
import { readDiscount } from "@/lib/discountForm";
import { defaultBalanceDue } from "@/lib/domain/orderFinance";
import { stageKeys, PAYMENT_METHODS, COST_CATEGORIES } from "@/lib/constants";

const keys = <T extends readonly { key: string }[]>(a: T) => a.map((x) => x.key) as [string, ...string[]];
const path = (id: string) => `/admin/orders/${id}`;

async function nextCode(): Promise<string> {
  const last = await db.order.findFirst({ orderBy: { code: "desc" }, select: { code: true } });
  const n = last ? parseInt(last.code.replace(/\D/g, ""), 10) + 1 : 1;
  return `SB-${String(n).padStart(4, "0")}`;
}

/** The client's standing discount, copied onto a new order. */
async function clientDiscount(clientId: string) {
  const c = await db.client.findUniqueOrThrow({
    where: { id: clientId },
    select: { discountKind: true, discountMode: true, discountValue: true, discountReason: true },
  });
  return {
    discountKind: c.discountKind as DiscountKind,
    discountMode: c.discountMode as DiscountMode,
    discountValue: c.discountValue,
    discountReason: c.discountReason,
  };
}

export async function createOrder(fd: FormData) {
  await requireUser();
  const data = z
    .object({
      clientId: z.string().min(1, "Choose a client"),
      title: z.string().min(1).max(120),
      kind: z.enum(["bridal", "evening"]),
    })
    .parse({ clientId: str(fd, "clientId"), title: str(fd, "title"), kind: str(fd, "kind") });
  const listPrice = money(fd, "listPrice");
  const eventDate = optDate(fd, "eventDate");
  const discount = await clientDiscount(data.clientId);

  const order = await db.order.create({
    data: {
      ...data,
      code: await nextCode(),
      eventDate,
      listPrice,
      ...discount,
      finalPrice: finalPrice({ listPrice, ...discount }),
      balanceDueDate: defaultBalanceDue(eventDate),
      stageLogs: { create: { stage: "inquiry" } },
    },
  });
  redirect(path(order.id));
}

export async function updateOrderInfo(id: string, fd: FormData) {
  await requireUser();
  await db.order.update({
    where: { id },
    data: {
      title: z.string().min(1).max(120).parse(str(fd, "title")),
      kind: z.enum(["bridal", "evening"]).parse(str(fd, "kind")),
      eventDate: optDate(fd, "eventDate"),
      notes: optStr(fd, "notes"),
    },
  });
  revalidatePath(path(id));
}

export async function setStage(id: string, fd: FormData) {
  await requireUser();
  const stage = z.enum(stageKeys).parse(str(fd, "stage"));
  const current = await db.order.findUniqueOrThrow({ where: { id }, select: { stage: true } });
  if (current.stage === stage) return;
  await db.$transaction([
    db.order.update({ where: { id }, data: { stage } }),
    db.orderStageLog.create({ data: { orderId: id, stage, note: optStr(fd, "note") } }),
  ]);
  revalidatePath(path(id));
  revalidatePath("/admin/orders");
}

export async function savePricing(id: string, fd: FormData) {
  await requireUser();
  const discount = readDiscount(fd);
  const listPrice = money(fd, "listPrice");

  const order = await db.order.findUniqueOrThrow({ where: { id }, select: { eventDate: true } });
  await db.order.update({
    where: { id },
    data: {
      listPrice,
      ...discount,
      finalPrice: finalPrice({ listPrice, ...discount }),
      depositAmount: money(fd, "depositAmount"),
      depositDueDate: optDate(fd, "depositDueDate"),
      balanceDueDate: optDate(fd, "balanceDueDate") ?? defaultBalanceDue(order.eventDate),
    },
  });
  revalidatePath(path(id));
}

export async function addPayment(orderId: string, fd: FormData) {
  await requireUser();
  const amount = money(fd, "amount");
  if (amount <= 0) throw new Error("Amount must be above zero");
  await db.payment.create({
    data: {
      orderId,
      amount,
      paidAt: optDate(fd, "paidAt") ?? new Date(),
      method: z.enum(keys(PAYMENT_METHODS)).parse(str(fd, "method")),
      isDeposit: fd.get("isDeposit") === "on",
      note: optStr(fd, "note"),
    },
  });
  revalidatePath(path(orderId));
}

export async function deletePayment(orderId: string, paymentId: string) {
  await requireUser();
  await db.payment.delete({ where: { id: paymentId, orderId } });
  revalidatePath(path(orderId));
}

export async function addCost(orderId: string, fd: FormData) {
  await requireUser();
  const amount = money(fd, "amount");
  if (amount <= 0) throw new Error("Amount must be above zero");
  await db.orderCost.create({
    data: {
      orderId,
      amount,
      category: z.enum(keys(COST_CATEGORIES)).parse(str(fd, "category")),
      description: z.string().min(1).max(200).parse(str(fd, "description")),
      incurredAt: optDate(fd, "incurredAt") ?? new Date(),
    },
  });
  revalidatePath(path(orderId));
}

export async function deleteCost(orderId: string, costId: string) {
  await requireUser();
  await db.orderCost.delete({ where: { id: costId, orderId } });
  revalidatePath(path(orderId));
}

/** Takes a supply off the shelf for this gown at today's price. */
export async function addMaterial(orderId: string, fd: FormData) {
  await requireUser();
  const itemId = z.string().min(1, "Choose a supply").parse(str(fd, "itemId"));
  const quantity = qty(fd, "quantity");
  if (quantity <= 0) throw new Error("Quantity must be above zero");
  await db.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId } });
    await tx.orderMaterial.create({ data: { orderId, itemId, quantity, unitCost: item.lastPrice, usedAt: optDate(fd, "usedAt") ?? new Date() } });
    await tx.inventoryItem.update({ where: { id: itemId }, data: { stock: roundQty(item.stock - quantity) } });
  });
  revalidatePath(path(orderId));
  revalidatePath("/admin/supplies");
}

/** Removes a material from the gown and puts it back in stock. */
export async function removeMaterial(orderId: string, materialId: string) {
  await requireUser();
  await db.$transaction(async (tx) => {
    const m = await tx.orderMaterial.delete({ where: { id: materialId, orderId } });
    const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: m.itemId } });
    await tx.inventoryItem.update({ where: { id: m.itemId }, data: { stock: roundQty(item.stock + m.quantity) } });
  });
  revalidatePath(path(orderId));
  revalidatePath("/admin/supplies");
}
