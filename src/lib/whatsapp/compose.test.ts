import { describe, expect, it } from "vitest";
import { egp } from "../money";
import { composeAppointment, composeOrder, invoiceText, waLink } from "./compose";
import { render } from "./templates";

const order = {
  code: "SB-0007",
  title: "Ivory silk column",
  listPrice: egp(50000),
  discountKind: "family_friends",
  discountReason: null,
  depositAmount: egp(15000),
  depositDueDate: new Date("2026-11-01T10:00:00Z"),
  balanceDueDate: new Date("2026-12-01T10:00:00Z"),
};
const finance = { discount: egp(5000), finalPrice: egp(45000), paid: egp(10000), balance: egp(35000) };
const payments = [{ amount: egp(10000), paidAt: new Date("2026-10-10T10:00:00Z"), isDeposit: true }];

describe("whatsapp compose", () => {
  it("fills placeholders and keeps unknown ones visible", () => {
    expect(render("Hi {{name}} {{x}}", { name: "Nour" })).toBe("Hi Nour {{x}}");
  });

  it("builds a wa.me link with encoded text", () => {
    expect(waLink("201030942434", "Hi & bye")).toBe("https://wa.me/201030942434?text=Hi%20%26%20bye");
  });

  it("itemises the invoice", () => {
    const t = invoiceText({ order, finance, payments }, "en");
    expect(t).toContain("Discount (family & friends)");
    expect(t).toContain("Total: EGP");
    expect(t).toContain("Balance: EGP");
  });

  it("offers deposit and balance reminders only when owed", () => {
    const keys = composeOrder({ order, finance, payments }, { name: "Nour Ali", language: "en" }).map((m) => m.key);
    expect(keys).toContain("deposit_due");
    expect(keys).toContain("balance_due");
    const settled = composeOrder({ order: { ...order, depositAmount: 0 }, finance: { ...finance, paid: finance.finalPrice, balance: 0 }, payments }, { name: "Nour", language: "en" }).map((m) => m.key);
    expect(settled).not.toContain("deposit_due");
    expect(settled).not.toContain("balance_due");
  });

  it("writes in the client's language and uses her first name", () => {
    const [confirm] = composeAppointment({ type: "fitting1", startsAt: new Date("2026-10-22T09:00:00Z") }, { name: "Nour Ali", language: "ar" });
    expect(confirm.body).toContain("عزيزتي Nour");
    expect(confirm.body).toContain("البروفة الأولى");
  });

  it("uses an edited template when present", () => {
    const [confirm] = composeAppointment({ type: "consultation", startsAt: new Date() }, { name: "Nour", language: "en" }, { "booking_confirmed:en": "Hello {{name}}!" });
    expect(confirm.body).toBe("Hello Nour!");
  });
});
