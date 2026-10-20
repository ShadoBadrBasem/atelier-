import { randomBytes } from "node:crypto";

/** Lowercase alphanumeric id, safe for file paths. */
export function createId(): string {
  return "a" + randomBytes(12).toString("hex");
}
