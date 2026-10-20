import Link from "next/link";
import { db } from "@/lib/db";
import { Empty, PageHeader, btnCls } from "@/components/ui";
import { addDaysKey, dayKey, fmtTime, startOfDay, todayKey } from "@/lib/cairo";
import { apptLabel } from "@/lib/constants";

type View = "day" | "week" | "month";
const WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]; // Egyptian week starts Saturday
const weekdayOf = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay(); // 0 = Sunday
const satIndex = (key: string) => (weekdayOf(key) + 1) % 7; // 0 = Saturday
const label = (key: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts }).format(new Date(`${key}T12:00:00Z`));

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; d?: string }>;
}) {
  const sp = await searchParams;
  const view: View = sp.view === "day" || sp.view === "week" ? sp.view : "month";
  const d = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : todayKey();
  const today = todayKey();

  let from: string, to: string;
  if (view === "day") { from = d; to = addDaysKey(d, 1); }
  else if (view === "week") { from = addDaysKey(d, -satIndex(d)); to = addDaysKey(from, 7); }
  else {
    const first = `${d.slice(0, 7)}-01`;
    from = addDaysKey(first, -satIndex(first));
    const nextMonth = addDaysKey(`${d.slice(0, 7)}-28`, 7).slice(0, 7) + "-01";
    to = addDaysKey(nextMonth, (7 - satIndex(nextMonth)) % 7);
  }

  const appts = await db.appointment.findMany({
    where: { startsAt: { gte: startOfDay(from), lt: startOfDay(to) }, status: { not: "cancelled" } },
    orderBy: { startsAt: "asc" },
    include: { client: { select: { name: true } }, order: { select: { code: true } } },
  });
  const byDay = new Map<string, typeof appts>();
  for (const a of appts) {
    const k = dayKey(a.startsAt);
    byDay.set(k, [...(byDay.get(k) ?? []), a]);
  }
  const days: string[] = [];
  for (let k = from; k < to; k = addDaysKey(k, 1)) days.push(k);

  const step = view === "day" ? 1 : view === "week" ? 7 : 0;
  const prev = step ? addDaysKey(d, -step) : addDaysKey(`${d.slice(0, 7)}-01`, -1).slice(0, 7) + "-01";
  const next = step ? addDaysKey(d, step) : addDaysKey(`${d.slice(0, 7)}-28`, 7).slice(0, 7) + "-01";
  const href = (v: View, k: string) => `/admin/calendar?view=${v}&d=${k}`;
  const title =
    view === "month" ? label(d, { month: "long", year: "numeric" })
    : view === "week" ? `Week of ${label(from, { day: "numeric", month: "short" })}`
    : label(d, { weekday: "long", day: "numeric", month: "long" });

  const dayList = (k: string) => {
    const list = byDay.get(k) ?? [];
    return list.length === 0 ? <Empty>Nothing scheduled.</Empty> : (
      <ul className="flex flex-col gap-2">
        {list.map((a) => (
          <li key={a.id}>
            <Link href={`/admin/calendar/${a.id}`} className={`block border-s-4 bg-cream/70 p-2 ${a.type.includes("fitting") ? "border-s-copper" : a.type === "delivery" ? "border-s-olive" : "border-s-oxblood"}`}>
              <div className="text-sm tabular-nums">{fmtTime(a.startsAt)}–{fmtTime(a.endsAt)} · {apptLabel(a.type)}</div>
              <div className="text-xs text-ink-soft">{a.client?.name ?? "No client"}{a.order ? ` · ${a.order.code}` : ""}{a.status !== "scheduled" ? ` · ${a.status}` : ""}</div>
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main>
      <PageHeader title={title} action={<Link href={`/admin/calendar/new?d=${d}`} className={btnCls}>Schedule</Link>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["day", "week", "month"] as View[]).map((v) => (
          <Link key={v} href={href(v, d)} className={`px-3 py-1.5 text-xs uppercase tracking-wider ${view === v ? "bg-oxblood text-cream" : "border border-olive/50"}`}>{v}</Link>
        ))}
        <span className="ms-auto flex gap-2">
          <Link href={href(view, prev)} className="border border-olive/50 px-3 py-1.5" aria-label="Previous">‹</Link>
          <Link href={href(view, today)} className="border border-olive/50 px-3 py-1.5 text-xs uppercase">Today</Link>
          <Link href={href(view, next)} className="border border-olive/50 px-3 py-1.5" aria-label="Next">›</Link>
        </span>
      </div>

      {view === "day" && dayList(d)}

      {view === "week" && (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((k) => (
            <section key={k} className={`min-w-0 ${k === today ? "bg-sand/40" : ""} p-1`}>
              <h2 className="mb-1 text-xs uppercase tracking-wider"><Link href={href("day", k)}>{label(k, { weekday: "short", day: "numeric" })}</Link></h2>
              {dayList(k)}
            </section>
          ))}
        </div>
      )}

      {view === "month" && (
        // Tablet/laptop: month grid with the selected day beside it (split view).
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="lg:flex-1">
            <div className="grid grid-cols-7 text-center text-[11px] uppercase tracking-wider text-ink-soft">
              {WEEKDAYS.map((w) => <div key={w} className="py-1">{w}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-px bg-olive/30">
              {days.map((k) => {
                const n = byDay.get(k)?.length ?? 0;
                const inMonth = k.slice(0, 7) === d.slice(0, 7);
                return (
                  <Link key={k} href={href("month", k)}
                    className={`flex aspect-square flex-col items-center justify-start p-1 text-sm md:aspect-auto md:min-h-20 ${k === d ? "bg-oxblood text-cream" : k === today ? "bg-sand" : "bg-cream"} ${inMonth ? "" : "opacity-40"}`}>
                    <span className="tabular-nums">{Number(k.slice(8))}</span>
                    {n > 0 && <span className={`mt-1 text-[10px] ${k === d ? "" : "text-copper"}`}>{"●".repeat(Math.min(n, 4))}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
          <aside className="lg:w-80">
            <h2 className="mb-2 font-display text-lg">{label(d, { weekday: "long", day: "numeric", month: "short" })}</h2>
            {dayList(d)}
          </aside>
        </div>
      )}
    </main>
  );
}
