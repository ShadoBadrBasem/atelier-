import { describe, expect, it } from "vitest";
import { egp } from "../money";
import { clientAccount, discountLabel } from "./clientAccount";

const order = (listPrice: number, discount: number, deposit: number, payments: { amount: number; isDeposit: boolean }[]) => {
  const finalPrice = listPrice - discount;
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  return {
    listPrice,
    depositAmount: deposit,
    payments,
    finance: { discount, finalPrice, paid, balance: Math.max(0, finalPrice - paid) },
  };
};

describe("clientAccount", () => {
  it("is all zeros with no orders", () => {
    expect(clientAccount([]).balance).toBe(0);
  });

  it("sums discounts, deposits and balances across orders", () => {
    const a = clientAccount([
      order(egp(50000), egp(5000), egp(15000), [{ amount: egp(15000), isDeposit: true }]),
      order(egp(20000), 0, egp(6000), [{ amount: egp(2000), isDeposit: true }]),
    ]);
    expect(a.listTotal).toBe(egp(70000));
    expect(a.discountTotal).toBe(egp(5000));
    expect(a.finalTotal).toBe(egp(65000));
    expect(a.depositRequired).toBe(egp(21000));
    expect(a.depositCollected).toBe(egp(17000));
    expect(a.depositOutstanding).toBe(egp(4000));
    expect(a.depositPayments).toBe(egp(17000));
    expect(a.balance).toBe(egp(48000));
  });

  it("caps deposit collected at the required deposit", () => {
    const a = clientAccount([order(egp(30000), 0, egp(10000), [{ amount: egp(25000), isDeposit: false }])]);
    expect(a.depositCollected).toBe(egp(10000));
    expect(a.depositOutstanding).toBe(0);
  });
});

describe("discountLabel", () => {
  const fmt = (p: number) => `${p / 100} EGP`;
  it("is null without a discount", () => {
    expect(discountLabel({ discountKind: "none", discountMode: "percent", discountValue: 1000 }, fmt)).toBeNull();
  });
  it("formats percent and amount", () => {
    expect(discountLabel({ discountKind: "family_friends", discountMode: "percent", discountValue: 1000 }, fmt)).toBe("Family & friends · 10%");
    expect(discountLabel({ discountKind: "other", discountMode: "amount", discountValue: egp(2000) }, fmt)).toBe("Discount · 2000 EGP per order");
  });
});
