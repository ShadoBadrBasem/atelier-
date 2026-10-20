"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Today", exact: true },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/tasks", label: "Tasks" },
];

export function NavLinks({ variant }: { variant: "bottom" | "side" }) {
  const path = usePathname();
  return (
    <>
      {ITEMS.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        const base =
          variant === "bottom"
            ? "flex-1 py-3 text-center text-[11px] uppercase tracking-[0.15em]"
            : "px-3 py-2 text-sm uppercase tracking-[0.2em]";
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`${base} ${active ? "bg-oxblood text-cream" : "text-oxblood"}`}
          >
            {i.label}
          </Link>
        );
      })}
    </>
  );
}
