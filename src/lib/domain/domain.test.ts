import { describe, expect, it } from "vitest";
import { egp } from "../money";
import { discountAmount, finalPrice, profit } from "./pricing";
import { paymentStatus, balance } from "./payment";

describe("pricing", () => {
  const base = { listPrice: egp(50000), discountKind: "none" as const, discountMode: "percent" as const, discountValue: 0 };

  it("no discount leaves the list price", () => {
    expect(finalPrice(base)).toBe(egp(50000));
  });

  it("family & friends 10% as basis points", () => {
    const p = { ...base, discountKind: "family_friends" as const, discountValue: 1000 };
    expect(discountAmount(p)).toBe(egp(5000));
    expect(finalPrice(p)).toBe(egp(45000));
  });

  it("fixed amount discount", () => {
    const p = { ...base, discountKind: "other" as const, discountMode: "amount" as const, discountValue: egp(2500) };
    expect(finalPrice(p)).toBe(egp(47500));
  });

  it("discount never exceeds the list price", () => {
    const p = { ...base, discountKind: "other" as const, discountMode: "amount" as const, discountValue: egp(99999) };
    expect(finalPrice(p)).toBe(0);
  });

  it("rejects non-integer money", () => {
    expect(() => discountAmount({ ...base, listPrice: 10.5 })).toThrow();
  });

  it("profit and margin", () => {
    expect(profit(egp(45000), egp(30000))).toEqual({
      revenue: egp(45000),
      cost: egp(30000),
      profit: egp(15000),
      marginBps: 3333,
    });
    expect(profit(0, egp(100)).marginBps).toBe(0);
  });
});

describe("payment status", () => {
  const now = new Date("2026-10-20T12:00:00Z");
  const day = 86_400_000;
  const mk = (over: Partial<Parameters<typeof paymentStatus>[0]> = {}) => ({
    finalPrice: egp(40000),
    depositAmount: egp(10000),
    depositDueDate: new Date(now.getTime() + 5 * day),
    balanceDueDate: new Date(now.getTime() + 30 * day),
    payments: [],
    ...over,
  });

  it("unpaid", () => expect(paymentStatus(mk(), now)).toBe("unpaid"));

  it("deposit paid", () =>
    expect(
      paymentStatus(mk({ payments: [{ amount: egp(10000), isDeposit: true }] }), now),
    ).toBe("deposit_paid"));

  it("partial after extra instalment", () =>
    expect(
      paymentStatus(
        mk({ payments: [{ amount: egp(10000), isDeposit: true }, { amount: egp(5000), isDeposit: false }] }),
        now,
      ),
    ).toBe("partial"));

  it("paid in full wins over overdue dates", () =>
    expect(
      paymentStatus(
        mk({ balanceDueDate: new Date(now.getTime() - day), payments: [{ amount: egp(40000), isDeposit: false }] }),
        now,
      ),
    ).toBe("paid"));

  it("overdue when deposit missed", () =>
    expect(paymentStatus(mk({ depositDueDate: new Date(now.getTime() - day) }), now)).toBe("overdue"));

  it("overdue when balance date passed and balance remains", () =>
    expect(
      paymentStatus(
        mk({ balanceDueDate: new Date(now.getTime() - day), payments: [{ amount: egp(10000), isDeposit: true }] }),
        now,
      ),
    ).toBe("overdue"));

  it("balance never negative", () =>
    expect(balance(mk({ payments: [{ amount: egp(50000), isDeposit: false }] }))).toBe(0));
});
