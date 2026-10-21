"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { money, optDate, optStr, qty, str } from "@/lib/form";
import { EXPENSE_CATEGORIES, INVENTORY_CATEGORIES } from "@/lib/constants";
import { lineTotal, roundQty } from "@/lib/domain/inventory";

const keys = <T extends readonly { key: string }[]>(a: T) => a.map((x) => x.key) as [string, ...string[]];
const itemPath = (id: string) => `/admin/supplies/${id}`;

function refresh(itemId?: string) {
  revalidatePath("/admin/supplies");
  revalidatePath("/admin/supplies/costs");
  revalidatePath("/admin");
  if (itemId) revalidatePath(itemPath(itemId));
}

function readItem(fd: FormData) {
  return {
    name: z.string().min(1, "Name is required").max(120).parse(str(fd, "name")),
    category: z.enum(keys(INVENTORY_CATEGORIES)).parse(str(fd, "category")),
    unit: z.string().min(1).max(20).parse(str(fd, "unit")),
    reorderLevel: qty(fd, "reorderLevel"),
    lastPrice: money(fd, "lastPrice"),
    supplierId: optStr(fd, "supplierId"),
  };
}

// ---- Items

export async function createItem(fd: FormData) {
  await requireUser();
  const item = await db.inventoryItem.create({ data: { ...readItem(fd), stock: qty(fd, "stock") } });
  refresh();
  redirect(itemPath(item.id));
}

export async function updateItem(id: string, fd: FormData) {
  await requireUser();
  await db.inventoryItem.update({ where: { id }, data: { ...readItem(fd), stock: roundQty(qty(fd, "stock")) } });
  refresh(id);
  redirect(`${itemPath(id)}?saved=1`);
}

export async function deleteItem(id: string) {
  await requireUser();
  const used = await db.orderMaterial.count({ where: { itemId: id } });
  if (used > 0) throw new Error("This item is used on orders, so it can't be deleted.");
  await db.inventoryItem.delete({ where: { id } });
  refresh();
  redirect("/admin/supplies");
}

/** A purchase adds stock, updates the item's price and (by default) logs a cost. */
export async function recordPurchase(itemId: string, fd: FormData) {
  await requireUser();
  const quantity = qty(fd, "quantity");
  if (quantity <= 0) throw new Error("Quantity must be above zero");
  const unitPrice = money(fd, "unitPrice");
  const total = lineTotal(quantity, unitPrice);
  const purchasedAt = optDate(fd, "purchasedAt") ?? new Date();
  const supplierId = optStr(fd, "supplierId");
  const logExpense = fd.get("logExpense") === "on";

  await db.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId } });
    const purchase = await tx.purchaseLog.create({ data: { itemId, supplierId, quantity, unitPrice, total, purchasedAt } });
    await tx.inventoryItem.update({
      where: { id: itemId },
      data: { stock: roundQty(item.stock + quantity), lastPrice: unitPrice, supplierId: supplierId ?? item.supplierId },
    });
    if (logExpense && total > 0) {
      await tx.expense.create({
        data: {
          category: item.category === "packaging" ? "packaging" : "materials",
          amount: total,
          spentAt: purchasedAt,
          description: `${item.name}: ${quantity} ${item.unit}`,
          purchaseId: purchase.id,
        },
      });
    }
  });
  refresh(itemId);
}

/** Undo a purchase: removes the stock it added and its linked cost. */
export async function deletePurchase(itemId: string, purchaseId: string) {
  await requireUser();
  await db.$transaction(async (tx) => {
    const p = await tx.purchaseLog.findUniqueOrThrow({ where: { id: purchaseId, itemId }, include: { expense: true } });
    if (p.expense) await tx.expense.delete({ where: { id: p.expense.id } });
    await tx.purchaseLog.delete({ where: { id: purchaseId } });
    const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId } });
    await tx.inventoryItem.update({ where: { id: itemId }, data: { stock: roundQty(item.stock - p.quantity) } });
  });
  refresh(itemId);
}

// ---- Suppliers

function readSupplier(fd: FormData) {
  return {
    name: z.string().min(1, "Name is required").max(120).parse(str(fd, "name")),
    phone: optStr(fd, "phone"),
    notes: optStr(fd, "notes"),
  };
}

export async function createSupplier(fd: FormData) {
  await requireUser();
  await db.supplier.create({ data: readSupplier(fd) });
  revalidatePath("/admin/supplies/suppliers");
}

export async function updateSupplier(id: string, fd: FormData) {
  await requireUser();
  await db.supplier.update({ where: { id }, data: readSupplier(fd) });
  revalidatePath("/admin/supplies/suppliers");
}

export async function deleteSupplier(id: string) {
  await requireUser();
  await db.supplier.delete({ where: { id } }); // items and purchases keep their rows, supplier set to null
  revalidatePath("/admin/supplies/suppliers");
  refresh();
}

// ---- Expenses

function readExpense(fd: FormData) {
  const amount = money(fd, "amount");
  if (amount <= 0) throw new Error("Amount must be above zero");
  return {
    category: z.enum(keys(EXPENSE_CATEGORIES)).parse(str(fd, "category")),
    amount,
    spentAt: optDate(fd, "spentAt") ?? new Date(),
    description: optStr(fd, "description"),
  };
}

export async function createExpense(fd: FormData) {
  await requireUser();
  await db.expense.create({ data: readExpense(fd) });
  refresh();
}

export async function updateExpense(id: string, fd: FormData) {
  await requireUser();
  await db.expense.update({ where: { id }, data: readExpense(fd) });
  refresh();
}

export async function deleteExpense(id: string) {
  await requireUser();
  await db.expense.delete({ where: { id } });
  refresh();
}
