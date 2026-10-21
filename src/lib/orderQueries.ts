import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { orderFinance } from "./domain/orderFinance";

export const financeInclude = {
  costs: { select: { category: true, amount: true } },
  materials: { select: { quantity: true, unitCost: true } },
  payments: { select: { amount: true, isDeposit: true } },
} as const;

/** Orders with derived payment status and profit, for lists, kanban and dashboard. */
export async function ordersWithFinance(where: Prisma.OrderWhereInput = {}) {
  const now = new Date();
  const orders = await db.order.findMany({
    where,
    orderBy: [{ eventDate: "asc" }, { createdAt: "desc" }],
    include: { client: { select: { id: true, name: true, whatsapp: true, language: true } }, ...financeInclude },
  });
  return orders.map((o) => ({ ...o, finance: orderFinance(o, now) }));
}
