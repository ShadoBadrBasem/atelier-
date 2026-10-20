import path from "node:path";
import fs from "node:fs/promises";

// Private files live here, outside public/, and are only served through
// authenticated routes.
export const STORAGE_DIR = path.resolve(
  /*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? "./storage",
);

export function attachmentDir(id: string) {
  if (!/^[a-z0-9]+$/i.test(id)) throw new Error("bad id");
  return path.join(STORAGE_DIR, "attachments", id);
}

export async function removeAttachmentFiles(id: string) {
  await fs.rm(attachmentDir(id), { recursive: true, force: true });
}

export async function storageUsageBytes(): Promise<number> {
  const sum = await (async function walk(dir: string): Promise<number> {
    let total = 0;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return 0;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      total += e.isDirectory() ? await walk(p) : (await fs.stat(p)).size;
    }
    return total;
  })(STORAGE_DIR);
  return sum;
}
