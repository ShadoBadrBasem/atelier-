import { db } from "./db";
import { roundQty } from "./domain/inventory";
import { removeAttachmentFiles } from "./storage";

/**
 * Permanently deletes an order. Materials it used go back into stock and its files are
 * removed from disk. Payments, costs, stage history and tracking links go with it;
 * appointments, tasks and message records stay, no longer linked to the order.
 */
export async function removeOrder(id: string) {
  const attachmentIds = await db.$transaction(async (tx) => {
    const materials = await tx.orderMaterial.findMany({ where: { orderId: id } });
    for (const m of materials) {
      const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: m.itemId } });
      await tx.inventoryItem.update({ where: { id: m.itemId }, data: { stock: roundQty(item.stock + m.quantity) } });
    }
    const attachments = await tx.attachment.findMany({ where: { orderId: id }, select: { id: true } });
    await tx.order.delete({ where: { id } }); // cascades to the order's own rows
    return attachments.map((a) => a.id);
  });
  await Promise.all(attachmentIds.map(removeAttachmentFiles));
}
