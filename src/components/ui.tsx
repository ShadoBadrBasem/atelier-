import type { ReactNode } from "react";

export const inputCls =
  "min-h-11 font-sans w-full border border-olive/50 bg-cream/60 px-3 py-2.5 text-oxblood placeholder:text-ink-soft focus:border-oxblood focus:outline-none";
export const btnCls =
  "min-h-11 font-sans transition-colors duration-200 inline-flex items-center justify-center bg-oxblood px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-cream active:opacity-80";
export const btnGhostCls =
  "min-h-11 font-sans transition-colors duration-200 inline-flex items-center justify-center border border-oxblood/60 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-oxblood active:bg-sand";
export const btnDangerCls =
  "min-h-11 font-sans transition-colors duration-200 inline-flex items-center justify-center border border-burnt px-3 py-2 text-xs uppercase tracking-[0.15em] text-oxblood active:bg-burnt active:text-cream";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 font-sans">
      <span className="text-xs uppercase tracking-[0.15em] text-ink-soft">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export function Card({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="border border-olive/30 bg-cream/50 p-4 sm:p-5">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="font-display text-lg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, cls = "bg-sand text-oxblood" }: { children: ReactNode; cls?: string }) {
  return <span className={`inline-block px-2 py-0.5 text-[11px] uppercase tracking-wider ${cls}`}>{children}</span>;
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 pb-4 pt-6">
      <div>
        <h1 className="font-display text-3xl leading-tight">{title}</h1>
        {sub && <p className="text-sm text-ink-soft">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-ink-soft">{children}</p>;
}

