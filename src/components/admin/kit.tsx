import type { ReactNode } from "react";

// Admin-only layout primitives. Styles live in src/app/admin/admin.css.

export function PageTitle({ title, sub, eyebrow, action }: { title: string; sub?: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <header className="at-title">
      <div className="min-w-0">
        {eyebrow && <p className="at-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {sub && <p className="at-sub">{sub}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </header>
  );
}

export function Panel({
  title,
  eyebrow,
  action,
  accent,
  className = "",
  children,
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  accent?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`at-panel ${accent ? "is-accent" : ""} ${className}`}>
      {(title || action) && (
        <div className="at-panel-head">
          <div>
            {eyebrow && <p className="at-eyebrow">{eyebrow}</p>}
            {title && <h2>{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="at-empty">{children}</p>;
}

type Tone = "good" | "warn" | "copper" | "ox";

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone }) {
  return (
    <div className={`at-stat ${tone ? `tone-${tone}` : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {hint && <span className="at-stat-hint">{hint}</span>}
    </div>
  );
}

export function Stats({ cols = 4, children }: { cols?: 3 | 4; children: ReactNode }) {
  return <dl className={`at-stats cols-${cols}`}>{children}</dl>;
}

/** 0..1 progress bar. */
export function Meter({ value, warn }: { value: number; warn?: boolean }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`at-meter ${warn ? "is-warn" : ""}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Tabs({ items, current }: { items: { href: string; label: string; key: string }[]; current: string }) {
  return (
    <nav className="at-tabs">
      {items.map((i) => (
        <a key={i.key} href={i.href} aria-current={i.key === current ? "page" : undefined}>{i.label}</a>
      ))}
    </nav>
  );
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}
