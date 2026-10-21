import type { Piasters } from "../money";

export type StockStatus = "out" | "low" | "ok";

/** "low" at or below the reorder level; "out" at zero or below. */
export function stockStatus(stock: number, reorderLevel: number): StockStatus {
  if (stock <= 0) return "out";
  if (stock <= reorderLevel) return "low";
  return "ok";
}

/** Value of what is on the shelf at the last purchase price. */
export function stockValue(stock: number, unitPrice: Piasters): Piasters {
  return Math.max(0, Math.round(stock * unitPrice));
}

/** Total for a purchase line, in piasters. */
export function lineTotal(quantity: number, unitPrice: Piasters): Piasters {
  return Math.round(quantity * unitPrice);
}

/** How much to buy to get back to twice the reorder level (a simple default). */
export function suggestedReorder(stock: number, reorderLevel: number): number {
  if (reorderLevel <= 0) return 0;
  return Math.max(0, Math.ceil(reorderLevel * 2 - stock));
}

/** Rounds stock quantities to avoid float noise like 2.9999999. */
export const roundQty = (n: number) => Math.round(n * 1000) / 1000;
