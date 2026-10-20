import { egp } from "./money";
import { parseCairo } from "./cairo";

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const optStr = (fd: FormData, k: string) => str(fd, k) || null;

/** EGP text ("45000", "45,000.50") -> piasters. Empty -> 0. */
export function money(fd: FormData, k: string): number {
  const raw = str(fd, k).replace(/,/g, "");
  if (!raw) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid amount for ${k}`);
  return egp(n);
}

export function optDate(fd: FormData, k: string): Date | null {
  const v = str(fd, k);
  return v ? parseCairo(v) : null;
}

export function int(fd: FormData, k: string, fallback = 0): number {
  const n = parseInt(str(fd, k), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** WhatsApp numbers: digits only, Egyptian 01xxxxxxxxx -> 201xxxxxxxxx. */
export function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "20" + d.slice(1);
  return d || null;
}
