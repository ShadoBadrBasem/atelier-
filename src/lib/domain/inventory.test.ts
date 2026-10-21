import { describe, expect, it } from "vitest";
import { egp } from "../money";
import { lineTotal, roundQty, stockStatus, stockValue, suggestedReorder } from "./inventory";

describe("inventory", () => {
  it("flags low and out of stock", () => {
    expect(stockStatus(10, 5)).toBe("ok");
    expect(stockStatus(5, 5)).toBe("low");
    expect(stockStatus(0, 5)).toBe("out");
    expect(stockStatus(-1, 0)).toBe("out");
  });

  it("values stock and purchase lines in piasters", () => {
    expect(stockValue(2.5, egp(400))).toBe(egp(1000));
    expect(stockValue(-3, egp(400))).toBe(0);
    expect(lineTotal(3.5, egp(120))).toBe(egp(420));
  });

  it("suggests topping up to twice the reorder level", () => {
    expect(suggestedReorder(2, 5)).toBe(8);
    expect(suggestedReorder(12, 5)).toBe(0);
    expect(suggestedReorder(1, 0)).toBe(0);
  });

  it("rounds float noise", () => {
    expect(roundQty(0.1 + 0.2)).toBe(0.3);
  });
});
