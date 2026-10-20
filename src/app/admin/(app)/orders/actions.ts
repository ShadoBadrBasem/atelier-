"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { money, optDate, optStr, str } from "@/lib/form";
import { finalPrice } from "@/lib/domain/pricing";
import { defaultBalanceDue } from "@/lib/domain/orderFinance";
import { stageKeys, PAYMENT_METHODS, COST_CATEGORIES } from "@/lib/constants";

const keys = <T extends readonly { key: string }[]>(a: T) => a.map((x) => x.key) as [string, ...string[]];
const path = (id: string) => `/admin/orders/${id}`;

async function nextCode(): Promise<string> {
  const last = await db.order.findFirst({ orderBy: { code: "desc" }, select: { code: true } });
  const n = last ? parseInt(last.code.replace(/\D/g, ""), 10) + 1 : 1;
  return `SB-${String(n).padStart(4, "0")}`;
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

  const order = await db.order.create({
    data: {
      ...data,
      code: await nextCode(),
      eventDate,
      listPrice,
      finalPrice: listPrice,
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
  const discountKind = z.enum(["none", "family_friends", "other"]).parse(str(fd, "discountKind"));
  const discountMode = z.enum(["percent", "amount"]).parse(str(fd, "discountMode"));
  const reason = optStr(fd, "discountReason");
  if (discountKind === "other" && !reason) throw new Error("Give a reason for the discount");

  const listPrice = money(fd, "listPrice");
  let discountValue = 0;
  if (discountKind !== "none") {
    if (discountMode === "percent") {
      const pct = Number(str(fd, "discountValue") || "0");
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new Error("Percent must be 0-100");
      discountValue = Math.round(pct * 100); // basis points
    } else {
      discountValue = money(fd, "discountValue");
    }
  }

  const order = await db.order.findUniqueOrThrow({ where: { id }, select: { eventDate: true } });
  await db.order.update({
    where: { id },
    data: {
      listPrice,
      discountKind,
      discountMode,
      discountValue,
      discountReason: discountKind === "none" ? null : reason,
      finalPrice: finalPrice({ listPrice, discountKind, discountMode, discountValue }),
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
