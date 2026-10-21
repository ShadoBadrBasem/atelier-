import { db } from "../db";
import type { Overrides } from "./compose";

/** Template wording the founder edited in Settings, keyed `${key}:${language}`. */
export async function loadOverrides(): Promise<Overrides> {
  const rows = await db.messageTemplate.findMany();
  return Object.fromEntries(rows.map((r) => [`${r.key}:${r.language}`, r.body]));
}
