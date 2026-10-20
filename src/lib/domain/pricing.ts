import { assertMoney, type Piasters } from "../money";

export type DiscountKind = "none" | "family_friends" | "other";
export type DiscountMode = "percent" | "amount";

export interface Pricing {
  listPrice: Piasters;
  discountKind: DiscountKind;
  discountMode: DiscountMode;
  /** percent => basis points (10% = 1000); amount => piasters */
  discountValue: number;
}

/** Discount in piasters, clamped to [0, listPrice]. */
export function discountAmount(p: Pricing): Piasters {
  assertMoney(p.listPrice, "listPrice");
  if (p.discountKind === "none" || p.discountValue <= 0) return 0;
  const raw =
    p.discountMode === "percent"
      ? Math.round((p.listPrice * Math.min(p.discountValue, 10000)) / 10000)
      : assertMoney(p.discountValue, "discountValue");
  return Math.max(0, Math.min(raw, p.listPrice));
}

export function finalPrice(p: Pricing): Piasters {
  return p.listPrice - discountAmount(p);
}

export interface Profit {
  revenue: Piasters;
  cost: Piasters;
  profit: Piasters;
  /** margin in basis points of revenue, 0 when revenue is 0 */
  marginBps: number;
}

export function profit(final: Piasters, cost: Piasters): Profit {
  const p = final - cost;
  return {
    revenue: final,
    cost,
    profit: p,
    marginBps: final > 0 ? Math.round((p * 10000) / final) : 0,
  };
}
