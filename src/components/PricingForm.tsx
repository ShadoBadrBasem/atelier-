"use client";

import { useState } from "react";
import { Field, btnCls, inputCls } from "./ui";

/** Pricing & deposit form with a live final-price preview. Values in EGP. */
export function PricingForm({
  action,
  initial,
}: {
  action: (fd: FormData) => Promise<void>;
  initial: {
    listPrice: number; // EGP
    discountKind: string;
    discountMode: string;
    discountValue: number; // percent or EGP
    discountReason: string;
    depositAmount: number;
    depositDueDate: string;
    balanceDueDate: string;
  };
}) {
  const [list, setList] = useState(String(initial.listPrice || ""));
  const [kind, setKind] = useState(initial.discountKind);
  const [mode, setMode] = useState(initial.discountMode);
  const [value, setValue] = useState(String(initial.discountValue || ""));

  const lp = Number(list.replace(/,/g, "")) || 0;
  const v = Number(value.replace(/,/g, "")) || 0;
  const disc = kind === "none" ? 0 : Math.min(lp, mode === "percent" ? (lp * Math.min(v, 100)) / 100 : v);
  const fmt = (n: number) => new Intl.NumberFormat("en-EG", { maximumFractionDigits: 2 }).format(n);

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <Field label="List price (EGP)">
        <input name="listPrice" inputMode="decimal" value={list} onChange={(e) => setList(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Discount">
        <select name="discountKind" value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
          <option value="none">None</option>
          <option value="family_friends">Family & friends</option>
          <option value="other">Other</option>
        </select>
      </Field>
      {kind !== "none" && (
        <>
          <div className="flex gap-2">
            <Field label="Type">
              <select name="discountMode" value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>
                <option value="percent">%</option>
                <option value="amount">EGP</option>
              </select>
            </Field>
            <Field label={mode === "percent" ? "Percent" : "Amount (EGP)"}>
              <input name="discountValue" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label={kind === "other" ? "Reason (required)" : "Reason (optional)"}>
            <input name="discountReason" required={kind === "other"} defaultValue={initial.discountReason} className={inputCls} />
          </Field>
        </>
      )}
      {kind === "none" && <input type="hidden" name="discountMode" value="percent" />}

      <div className="flex flex-col justify-center border border-olive/40 bg-sand/30 p-3 text-sm md:col-span-2">
        <div className="flex justify-between"><span>List price</span><span className="tabular-nums">{fmt(lp)} EGP</span></div>
        <div className="flex justify-between text-burnt"><span>Discount</span><span className="tabular-nums">−{fmt(disc)} EGP</span></div>
        <div className="flex justify-between font-display text-lg"><span>Final price</span><span className="tabular-nums">{fmt(lp - disc)} EGP</span></div>
      </div>

      <Field label="Deposit required (EGP)">
        <input name="depositAmount" inputMode="decimal" defaultValue={initial.depositAmount || ""} className={inputCls} />
      </Field>
      <Field label="Deposit due">
        <input name="depositDueDate" type="date" defaultValue={initial.depositDueDate} className={inputCls} />
      </Field>
      <Field label="Balance due" hint="Leave empty to default to 7 days before the event.">
        <input name="balanceDueDate" type="date" defaultValue={initial.balanceDueDate} className={inputCls} />
      </Field>
      <div className="flex items-end">
        <button className={btnCls}>Save pricing</button>
      </div>
    </form>
  );
}
