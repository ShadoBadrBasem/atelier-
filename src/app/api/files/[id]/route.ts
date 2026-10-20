import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { STORAGE_DIR } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await auth())) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const v = url.searchParams.get("v") ?? "opt"; // thumb | opt | original

  const a = await db.attachment.findUnique({ where: { id } });
  if (!a) return new NextResponse("Not found", { status: 404 });

  let rel = a.originalPath;
  let mime = a.mime;
  if (v === "thumb" && a.thumbPath) { rel = a.thumbPath; mime = "image/webp"; }
  else if (v === "opt" && a.optimizedPath) { rel = a.optimizedPath; mime = "image/webp"; }

  const full = path.resolve(STORAGE_DIR, rel);
  if (!full.startsWith(STORAGE_DIR + path.sep)) return new NextResponse("Bad path", { status: 400 });

  let data: Buffer;
  try {
    data = await fs.readFile(full);
  } catch {
    return new NextResponse("Missing file", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": mime,
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };
  if (v === "original" && url.searchParams.get("dl")) {
    headers["Content-Disposition"] = `attachment; filename="${a.id}${path.extname(a.originalPath)}"`;
  }
  return new NextResponse(new Uint8Array(data), { headers });
}
