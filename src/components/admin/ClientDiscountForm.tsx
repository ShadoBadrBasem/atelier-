"use client";

import { useState } from "react";
import { Field, btnCls, inputCls } from "@/components/ui";

/** Standing discount for a client. Values in the form: percent or EGP. */
export function ClientDiscountForm({
  action,
  initial,
  openOrders,
}: {
  action: (fd: FormData) => Promise<void>;
  initial: { discountKind: string; discountMode: string; discountValue: number; discountReason: string };
  openOrders: number;
}) {
  const [kind, setKind] = useState(initial.discountKind);
  const [mode, setMode] = useState(initial.discountMode);

  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Discount">
        <select name="discountKind" value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
          <option value="none">None</option>
          <option value="family_friends">Family & friends</option>
          <option value="other">Other</option>
        </select>
      </Field>
      {kind !== "none" ? (
        <>
          <div className="grid grid-cols-[6rem_1fr] gap-2">
            <Field label="Type">
              <select name="discountMode" value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>
                <option value="percent">%</option>
                <option value="amount">EGP</option>
              </select>
            </Field>
            <Field label={mode === "percent" ? "Percent" : "EGP off each order"}>
              <input name="discountValue" inputMode="decimal" required defaultValue={initial.discountValue || ""} className={inputCls} />
            </Field>
          </div>
          <Field label={kind === "other" ? "Reason (required)" : "Reason (optional)"}>
            <input name="discountReason" required={kind === "other"} defaultValue={initial.discountReason} className={inputCls} />
          </Field>
        </>
      ) : (
        <input type="hidden" name="discountMode" value="percent" />
      )}
      {openOrders > 0 && (
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="applyToOpen" className="size-4 shrink-0 accent-[var(--oxblood)]" />
          <span>Also re-price her {openOrders} open order{openOrders > 1 ? "s" : ""} with this discount</span>
        </label>
      )}
      <button className={btnCls}>Save discount</button>
    </form>
  );
}
