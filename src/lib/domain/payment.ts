import type { Piasters } from "../money";

export type PaymentStatus =
  | "unpaid"
  | "deposit_paid"
  | "partial"
  | "paid"
  | "overdue";

export interface PaymentInput {
  finalPrice: Piasters;
  depositAmount: Piasters;
  depositDueDate?: Date | null;
  balanceDueDate?: Date | null;
  payments: { amount: Piasters; isDeposit: boolean }[];
}

export function totalPaid(payments: PaymentInput["payments"]): Piasters {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

export function balance(input: PaymentInput): Piasters {
  return Math.max(0, input.finalPrice - totalPaid(input.payments));
}

export function depositPaid(input: PaymentInput): boolean {
  return (
    input.depositAmount > 0 && totalPaid(input.payments) >= input.depositAmount
  );
}

/** Derived, never stored. `now` is injected so it is testable. */
export function paymentStatus(input: PaymentInput, now: Date): PaymentStatus {
  const paid = totalPaid(input.payments);
  if (input.finalPrice > 0 && paid >= input.finalPrice) return "paid";

  const depositOverdue =
    input.depositAmount > 0 &&
    paid < input.depositAmount &&
    !!input.depositDueDate &&
    input.depositDueDate < now;
  const balanceOverdue = !!input.balanceDueDate && input.balanceDueDate < now;
  if (depositOverdue || balanceOverdue) return "overdue";

  if (paid === 0) return "unpaid";
  const onlyDeposit = input.payments.every((p) => p.isDeposit);
  if (depositPaid(input) && onlyDeposit) return "deposit_paid";
  return "partial";
}
