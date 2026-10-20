import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { processUpload, MAX_UPLOAD_BYTES } from "@/lib/attachments";
import { removeAttachmentFiles } from "@/lib/storage";
import { ATTACHMENT_CATEGORIES } from "@/lib/constants";

export const runtime = "nodejs";

const meta = z.object({
  category: z.enum(ATTACHMENT_CATEGORIES.map((c) => c.key) as [string, ...string[]]).default("other"),
  clientId: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const m = meta.safeParse({
    category: String(fd.get("category") || "other"),
    clientId: fd.get("clientId") || undefined,
    orderId: fd.get("orderId") || undefined,
  });
  if (!m.success || (!m.data.clientId && !m.data.orderId)) {
    return NextResponse.json({ error: "Missing client or order" }, { status: 400 });
  }

  let clientId = m.data.clientId ?? null;
  const orderId = m.data.orderId ?? null;
  if (orderId) {
    const order = await db.order.findUnique({ where: { id: orderId }, select: { clientId: true } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    clientId = order.clientId;
  } else if (!(await db.client.findUnique({ where: { id: clientId! }, select: { id: true } }))) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const files = fd.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 });

  const results: { name: string; id?: string; error?: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      results.push({ name: file.name, error: "Larger than 25 MB" });
      continue;
    }
    let processed;
    try {
      processed = await processUpload(Buffer.from(await file.arrayBuffer()));
    } catch (e) {
      results.push({ name: file.name, error: e instanceof Error ? e.message : "Upload failed" });
      continue;
    }
    try {
      const count = await db.attachment.count({ where: orderId ? { orderId } : { clientId, orderId: null } });
      await db.attachment.create({
        data: {
          id: processed.id,
          clientId,
          orderId,
          category: m.data.category,
          mime: processed.mime,
          sizeBytes: processed.sizeBytes,
          originalPath: processed.originalPath,
          optimizedPath: processed.optimizedPath,
          thumbPath: processed.thumbPath,
          sortOrder: count,
        },
      });
      results.push({ name: file.name, id: processed.id });
    } catch {
      await removeAttachmentFiles(processed.id);
      results.push({ name: file.name, error: "Could not save" });
    }
  }

  const ok = results.some((r) => r.id);
  return NextResponse.json({ results }, { status: ok ? 200 : 422 });
}
