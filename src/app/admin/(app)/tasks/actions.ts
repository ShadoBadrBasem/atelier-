"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { int, optDate, optStr, str } from "@/lib/form";
import { nextDue, type Recurrence } from "@/lib/domain/tasks";

function refresh() {
  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
}

export async function createTask(fd: FormData) {
  await requireUser();
  const recurrence = z.enum(["daily", "weekly", "monthly"]).nullable().parse(optStr(fd, "recurrence"));
  const dueDate = optDate(fd, "dueDate");
  await db.task.create({
    data: {
      title: z.string().min(1).max(200).parse(str(fd, "title")),
      notes: optStr(fd, "notes"),
      dueDate: dueDate ?? (recurrence ? new Date() : null),
      priority: Math.min(3, Math.max(1, int(fd, "priority", 2))),
      recurrence,
      orderId: optStr(fd, "orderId"),
      clientId: optStr(fd, "clientId"),
    },
  });
  refresh();
}

/** Completing a recurring task creates its next occurrence. */
export async function toggleTask(id: string) {
  await requireUser();
  const t = await db.task.findUniqueOrThrow({ where: { id } });
  if (t.done) {
    await db.task.update({ where: { id }, data: { done: false, doneAt: null } });
  } else {
    const now = new Date();
    await db.$transaction(async (tx) => {
      await tx.task.update({ where: { id }, data: { done: true, doneAt: now } });
      if (t.recurrence && t.dueDate) {
        await tx.task.create({
          data: {
            title: t.title, notes: t.notes, priority: t.priority, recurrence: t.recurrence,
            orderId: t.orderId, clientId: t.clientId,
            dueDate: nextDue(t.dueDate, t.recurrence as Recurrence, now),
          },
        });
      }
    });
  }
  refresh();
}

export async function deleteTask(id: string) {
  await requireUser();
  await db.task.delete({ where: { id } });
  refresh();
}
