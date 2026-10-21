"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { removeAttachmentFiles } from "@/lib/storage";
import { ATTACHMENT_CATEGORIES } from "@/lib/constants";

const patch = z.object({
  category: z.enum(ATTACHMENT_CATEGORIES.map((c) => c.key) as [string, ...string[]]).optional(),
  caption: z.string().max(1000).nullable().optional(),
  sharedOnTracking: z.boolean().optional(),
});

function refresh(a: { clientId: string | null; orderId: string | null }) {
  if (a.orderId) revalidatePath(`/admin/orders/${a.orderId}`);
  if (a.clientId) revalidatePath(`/admin/clients/${a.clientId}`);
}

export async function updateAttachment(id: string, input: z.input<typeof patch>) {
  await requireUser();
  const data = patch.parse(input);
  const a = await db.attachment.update({ where: { id }, data });
  refresh(a);
}

/** One cover per order (or per client gallery when there is no order). */
export async function setCover(id: string) {
  await requireUser();
  const a = await db.attachment.findUniqueOrThrow({ where: { id } });
  const scope = a.orderId ? { orderId: a.orderId } : { clientId: a.clientId, orderId: null };
  await db.$transaction([
    db.attachment.updateMany({ where: scope, data: { isCover: false } }),
    db.attachment.update({ where: { id }, data: { isCover: true } }),
    ...(a.orderId
      ? [db.order.update({ where: { id: a.orderId }, data: { coverAttachmentId: id } })]
      : []),
  ]);
  refresh(a);
}

export async function deleteAttachment(id: string) {
  await requireUser();
  const a = await db.attachment.delete({ where: { id } });
  if (a.orderId && a.isCover) {
    await db.order.update({ where: { id: a.orderId }, data: { coverAttachmentId: null } });
  }
  await removeAttachmentFiles(id);
  refresh(a);
}

// ---- Mood board notes (client galleries)

const note = z.object({
  text: z.string().trim().min(1, "Write something first").max(1000),
  tone: z.enum(["sand", "copper", "olive", "rose"]).default("sand"),
});

export async function createBoardNote(clientId: string, input: z.input<typeof note>) {
  await requireUser();
  const data = note.parse(input);
  await db.boardNote.create({ data: { ...data, clientId } });
  revalidatePath(`/admin/clients/${clientId}`);
}

export async function updateBoardNote(id: string, input: z.input<typeof note>) {
  await requireUser();
  const n = await db.boardNote.update({ where: { id }, data: note.parse(input) });
  revalidatePath(`/admin/clients/${n.clientId}`);
}

export async function deleteBoardNote(id: string) {
  await requireUser();
  const n = await db.boardNote.delete({ where: { id } });
  revalidatePath(`/admin/clients/${n.clientId}`);
}
