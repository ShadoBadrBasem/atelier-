import type { Piasters } from "../money";
import type { OrderFinance } from "./orderFinance";

export interface AccountOrder {
  listPrice: Piasters;
  depositAmount: Piasters;
  payments: { amount: Piasters; isDeposit: boolean }[];
  finance: Pick<OrderFinance, "discount" | "finalPrice" | "paid" | "balance">;
}

export interface ClientAccount {
  listTotal: Piasters;
  discountTotal: Piasters;
  finalTotal: Piasters;
  depositRequired: Piasters;
  /** Paid toward each order's deposit, capped at that order's required deposit. */
  depositCollected: Piasters;
  depositOutstanding: Piasters;
  /** Sum of payments explicitly recorded as deposits. */
  depositPayments: Piasters;
  paid: Piasters;
  balance: Piasters;
}

/** Totals across all of one client's orders. Derived, never stored. */
export function clientAccount(orders: AccountOrder[]): ClientAccount {
  const a: ClientAccount = {
    listTotal: 0,
    discountTotal: 0,
    finalTotal: 0,
    depositRequired: 0,
    depositCollected: 0,
    depositOutstanding: 0,
    depositPayments: 0,
    paid: 0,
    balance: 0,
  };
  for (const o of orders) {
    const collected = Math.min(o.finance.paid, o.depositAmount);
    a.listTotal += o.listPrice;
    a.discountTotal += o.finance.discount;
    a.finalTotal += o.finance.finalPrice;
    a.depositRequired += o.depositAmount;
    a.depositCollected += collected;
    a.depositOutstanding += o.depositAmount - collected;
    a.depositPayments += o.payments.filter((p) => p.isDeposit).reduce((s, p) => s + p.amount, 0);
    a.paid += o.finance.paid;
    a.balance += o.finance.balance;
  }
  return a;
}

/** Human label for a stored discount, e.g. "Family & friends · 10%". */
export function discountLabel(
  d: { discountKind: string; discountMode: string; discountValue: number },
  fmtMoney: (p: Piasters) => string,
): string | null {
  if (d.discountKind === "none" || d.discountValue <= 0) return null;
  const kind = d.discountKind === "family_friends" ? "Family & friends" : "Discount";
  const value = d.discountMode === "percent" ? `${d.discountValue / 100}%` : `${fmtMoney(d.discountValue)} per order`;
  return `${kind} · ${value}`;
}
