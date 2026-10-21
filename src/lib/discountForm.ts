import { z } from "zod";
import { money, optStr, str } from "./form";

/** Reads discountKind/Mode/Value/Reason from a form, in the stored encoding. */
export function readDiscount(fd: FormData) {
  const discountKind = z.enum(["none", "family_friends", "other"]).parse(str(fd, "discountKind") || "none");
  const discountMode = z.enum(["percent", "amount"]).parse(str(fd, "discountMode") || "percent");
  const reason = optStr(fd, "discountReason");
  if (discountKind === "other" && !reason) throw new Error("Give a reason for the discount");

  let discountValue = 0;
  if (discountKind !== "none") {
    if (discountMode === "percent") {
      const pct = Number(str(fd, "discountValue") || "0");
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new Error("Percent must be 0-100");
      discountValue = Math.round(pct * 100); // basis points
    } else {
      discountValue = money(fd, "discountValue");
    }
  }
  return { discountKind, discountMode, discountValue, discountReason: discountKind === "none" ? null : reason };
}
