"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ICONS: Record<string, React.ReactNode> = {
  today: <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  calendar: <svg viewBox="0 0 24 24" {...stroke}><rect x="3.5" y="5" width="17" height="15" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  orders: <svg viewBox="0 0 24 24" {...stroke}><path d="M9 3h6l-1 4 4 14H6l4-14z" /><path d="M10 7h4" /></svg>,
  clients: <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5" /></svg>,
  supplies: <svg viewBox="0 0 24 24" {...stroke}><path d="M4 8l8-4 8 4-8 4z" /><path d="M4 8v8l8 4 8-4V8M12 12v8" /></svg>,
  tasks: <svg viewBox="0 0 24 24" {...stroke}><path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9" /></svg>,
};

const ITEMS = [
  { href: "/admin", label: "Today", icon: "today", exact: true },
  { href: "/admin/calendar", label: "Calendar", icon: "calendar" },
  { href: "/admin/orders", label: "Orders", icon: "orders" },
  { href: "/admin/clients", label: "Clients", icon: "clients" },
  { href: "/admin/supplies", label: "Supplies", icon: "supplies" },
  { href: "/admin/tasks", label: "Tasks", icon: "tasks" },
];

export function AdminNav({ variant }: { variant: "side" | "bottom" }) {
  const path = usePathname();
  return (
    <>
      {ITEMS.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={variant === "side" ? "at-nav-link" : undefined}>
            {ICONS[i.icon]}
            <span>{i.label}</span>
          </Link>
        );
      })}
    </>
  );
}
