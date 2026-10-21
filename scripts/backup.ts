// Daily backup: a consistent copy of the database plus all uploaded files.
//   npm run backup
// Writes BACKUP_DIR/atelier-YYYY-MM-DD_HHmm/{atelier.db, storage/} and keeps the
// newest BACKUP_KEEP folders (default 30). Put BACKUP_DIR in a synced folder
// (e.g. OneDrive) so a copy also lives off this computer.
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
const backupDir = path.resolve(root, process.env.BACKUP_DIR || "./backups");
const storageDir = path.resolve(root, process.env.STORAGE_DIR || "./storage");
const keep = Math.max(1, Number(process.env.BACKUP_KEEP || 30));

const stamp = () => {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}`;
};

async function main() {
  const target = path.join(backupDir, `atelier-${stamp()}`);
  await fs.mkdir(target, { recursive: true });

  // VACUUM INTO writes a consistent snapshot even while the app is running.
  const db = new PrismaClient();
  try {
    const file = path.join(target, "atelier.db").replace(/'/g, "''");
    await db.$executeRawUnsafe(`VACUUM INTO '${file}'`);
  } finally {
    await db.$disconnect();
  }

  await fs.cp(storageDir, path.join(target, "storage"), { recursive: true, force: true }).catch((e) => {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; // no uploads yet is fine
  });

  const all = (await fs.readdir(backupDir)).filter((n) => /^atelier-\d{4}-\d{2}-\d{2}_\d{4}$/.test(n)).sort();
  for (const old of all.slice(0, Math.max(0, all.length - keep))) {
    await fs.rm(path.join(backupDir, old), { recursive: true, force: true });
  }
  console.log(`Backup written to ${target} (keeping the newest ${keep}).`);
}

main().catch((e) => {
  console.error("Backup failed:", e);
  process.exit(1);
});
