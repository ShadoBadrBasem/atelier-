import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createId } from "./id";
import { attachmentDir } from "./storage";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif", "tiff"]);

export interface Processed {
  id: string;
  mime: string;
  sizeBytes: number;
  originalPath: string;
  optimizedPath: string | null;
  thumbPath: string | null;
}

/**
 * Validates by content (not the client-supplied type), keeps the original,
 * and writes an auto-rotated, EXIF-stripped WebP plus a thumbnail.
 * Paths returned are relative to STORAGE_DIR.
 */
export async function processUpload(buf: Buffer): Promise<Processed> {
  if (buf.length === 0) throw new Error("Empty file");
  if (buf.length > MAX_UPLOAD_BYTES) throw new Error("File is larger than 25 MB");

  const id = createId();
  const dir = attachmentDir(id);
  const rel = (name: string) => path.posix.join("attachments", id, name);

  const isPdf = buf.subarray(0, 5).toString("latin1") === "%PDF-";
  if (isPdf) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "original.pdf"), buf);
    return { id, mime: "application/pdf", sizeBytes: buf.length, originalPath: rel("original.pdf"), optimizedPath: null, thumbPath: null };
  }

  let format: string | undefined;
  try {
    format = (await sharp(buf).metadata()).format;
  } catch {
    throw new Error("Not a supported image or PDF");
  }
  if (!format || !IMAGE_FORMATS.has(format)) throw new Error("Unsupported image format");

  await fs.mkdir(dir, { recursive: true });
  const ext = format === "jpeg" ? "jpg" : format;
  await fs.writeFile(path.join(dir, `original.${ext}`), buf);

  const base = () => sharp(buf, { failOn: "error" }).rotate(); // rotate() applies EXIF orientation
  await base()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(dir, "optimized.webp"));
  await base()
    .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(path.join(dir, "thumb.webp"));

  return {
    id,
    mime: `image/${format === "jpeg" ? "jpeg" : format}`,
    sizeBytes: buf.length,
    originalPath: rel(`original.${ext}`),
    optimizedPath: rel("optimized.webp"),
    thumbPath: rel("thumb.webp"),
  };
}
