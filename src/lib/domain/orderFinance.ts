import type { Piasters } from "../money";
import { discountAmount, profit, type DiscountKind, type DiscountMode } from "./pricing";
import { balance, depositPaid, paymentStatus, totalPaid, type PaymentStatus } from "./payment";

export interface OrderFinanceInput {
  listPrice: Piasters;
  discountKind: string;
  discountMode: string;
  discountValue: number;
  finalPrice: Piasters;
  depositAmount: Piasters;
  depositDueDate: Date | null;
  balanceDueDate: Date | null;
  costs: { category: string; amount: Piasters }[];
  materials: { quantity: number; unitCost: Piasters }[];
  payments: { amount: Piasters; isDeposit: boolean }[];
}

export interface OrderFinance {
  materials: Piasters;
  labor: Piasters;
  other: Piasters;
  totalCost: Piasters;
  discount: Piasters;
  finalPrice: Piasters;
  paid: Piasters;
  balance: Piasters;
  depositPaid: boolean;
  status: PaymentStatus;
  profit: Piasters;
  marginBps: number;
}

export function materialsCost(materials: OrderFinanceInput["materials"]): Piasters {
  return materials.reduce((s, m) => s + Math.round(m.quantity * m.unitCost), 0);
}

export function orderFinance(o: OrderFinanceInput, now: Date): OrderFinance {
  const materials = materialsCost(o.materials);
  const labor = o.costs.filter((c) => c.category === "labor" || c.category === "outsourced").reduce((s, c) => s + c.amount, 0);
  const other = o.costs.filter((c) => c.category !== "labor" && c.category !== "outsourced").reduce((s, c) => s + c.amount, 0);
  const totalCost = materials + labor + other;
  const pay = {
    finalPrice: o.finalPrice,
    depositAmount: o.depositAmount,
    depositDueDate: o.depositDueDate,
    balanceDueDate: o.balanceDueDate,
    payments: o.payments,
  };
  const pr = profit(o.finalPrice, totalCost);
  return {
    materials,
    labor,
    other,
    totalCost,
    discount: discountAmount({
      listPrice: o.listPrice,
      discountKind: o.discountKind as DiscountKind,
      discountMode: o.discountMode as DiscountMode,
      discountValue: o.discountValue,
    }),
    finalPrice: o.finalPrice,
    paid: totalPaid(o.payments),
    balance: balance(pay),
    depositPaid: depositPaid(pay),
    status: paymentStatus(pay, now),
    profit: pr.profit,
    marginBps: pr.marginBps,
  };
}

/** Default balance due date: N days before the event (configurable later in Settings). */
export function defaultBalanceDue(eventDate: Date | null, daysBefore = 7): Date | null {
  if (!eventDate) return null;
  return new Date(eventDate.getTime() - daysBefore * 86_400_000);
}
