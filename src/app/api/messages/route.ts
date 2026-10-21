import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Logs a WhatsApp message the founder opened from the admin. Sent with
// navigator.sendBeacon, so it never delays opening WhatsApp.
const schema = z.object({
  templateKey: z.string().min(1).max(40),
  toPhone: z.string().regex(/^\d{8,15}$/),
  body: z.string().min(1).max(4000),
  clientId: z.string().min(1).nullish(),
  orderId: z.string().min(1).nullish(),
});

export async function POST(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  const { clientId, orderId, ...rest } = parsed.data;
  await db.messageLog.create({ data: { ...rest, clientId: clientId ?? null, orderId: orderId ?? null, channel: "whatsapp_link" } });
  return NextResponse.json({ ok: true });
}
