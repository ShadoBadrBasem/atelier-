import { describe, expect, it } from "vitest";
import { nextDue } from "./tasks";
import { orderFinance, defaultBalanceDue } from "./orderFinance";
import { parseCairo, dayKey, addDaysKey } from "../cairo";

describe("recurring tasks", () => {
  const d = new Date("2026-10-20T07:00:00Z");
  it("daily", () => expect(nextDue(d, "daily").toISOString()).toBe("2026-10-21T07:00:00.000Z"));
  it("weekly", () => expect(nextDue(d, "weekly").toISOString()).toBe("2026-10-27T07:00:00.000Z"));
  it("monthly clamps to month end", () =>
    expect(nextDue(new Date("2026-01-31T07:00:00Z"), "monthly").toISOString()).toBe("2026-02-28T07:00:00.000Z"));
  it("catches up when completed late", () =>
    expect(nextDue(d, "daily", new Date("2026-10-25T09:00:00Z")).toISOString()).toBe("2026-10-26T07:00:00.000Z"));
});

describe("order finance", () => {
  it("sums materials, labor and other; profit after discount", () => {
    const f = orderFinance(
      {
        listPrice: 5_000_000, discountKind: "family_friends", discountMode: "percent", discountValue: 1000,
        finalPrice: 4_500_000, depositAmount: 1_000_000, depositDueDate: null, balanceDueDate: null,
        costs: [{ category: "labor", amount: 800_000 }, { category: "outsourced", amount: 200_000 }, { category: "other", amount: 50_000 }],
        materials: [{ quantity: 4.5, unitCost: 300_000 }],
        payments: [{ amount: 1_000_000, isDeposit: true }],
      },
      new Date(),
    );
    expect(f.materials).toBe(1_350_000);
    expect(f.labor).toBe(1_000_000);
    expect(f.totalCost).toBe(2_400_000);
    expect(f.discount).toBe(500_000);
    expect(f.profit).toBe(2_100_000);
    expect(f.status).toBe("deposit_paid");
    expect(f.balance).toBe(3_500_000);
  });
  it("default balance due is 7 days before the event", () =>
    expect(defaultBalanceDue(new Date("2026-12-10T00:00:00Z"))!.toISOString()).toBe("2026-12-03T00:00:00.000Z"));
});

describe("Cairo time", () => {
  it("parses wall time in winter (UTC+2)", () =>
    expect(parseCairo("2026-12-01T10:00")!.toISOString()).toBe("2026-12-01T08:00:00.000Z"));
  it("parses wall time in summer DST (UTC+3)", () =>
    expect(parseCairo("2026-07-01T10:00")!.toISOString()).toBe("2026-07-01T07:00:00.000Z"));
  it("day key uses the Cairo calendar day", () =>
    expect(dayKey(new Date("2026-12-01T23:30:00Z"))).toBe("2026-12-02"));
  it("adds days across months", () => expect(addDaysKey("2026-10-30", 3)).toBe("2026-11-02"));
});
