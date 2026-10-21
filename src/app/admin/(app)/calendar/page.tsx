import Link from "next/link";
import { db } from "@/lib/db";
import { btnCls } from "@/components/ui";
import { Empty, Legend, PageTitle, Panel, PhasePill, Tabs } from "@/components/admin/kit";
import { addDaysKey, dayKey, fmtTime, startOfDay, todayKey } from "@/lib/cairo";
import { APPOINTMENT_TYPES, apptLabel } from "@/lib/constants";
import { apptColor } from "@/lib/phaseColors";

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

  const STATUS_LABEL: Record<string, string> = { done: "Done", no_show: "No show" };
  const event = (a: (typeof appts)[number]) => {
    const c = apptColor(a.type);
    return (
      <Link key={a.id} href={`/admin/calendar/${a.id}`} className={`cal-event is-${a.status}`} style={{ ["--appt" as string]: c.bg }}>
        <div className="flex items-center justify-between gap-2">
          <span className="cal-event-time">{fmtTime(a.startsAt)}<span className="at-muted text-sm">–{fmtTime(a.endsAt)}</span></span>
          <PhasePill color={c}>{apptLabel(a.type)}</PhasePill>
        </div>
        <div className="cal-event-title">{a.client?.name ?? "No client"}</div>
        {(a.order || STATUS_LABEL[a.status]) && (
          <div className="cal-event-meta">{[a.order?.code, STATUS_LABEL[a.status]].filter(Boolean).join(" · ")}</div>
        )}
      </Link>
    );
  };
  const dayList = (k: string) => {
    const list = byDay.get(k) ?? [];
    return list.length === 0 ? <Empty>Nothing scheduled.</Empty> : <div className="flex flex-col gap-2">{list.map(event)}</div>;
  };
  const isWeekend = (k: string) => satIndex(k) === 0 || satIndex(k) === 6; // Saturday and Friday

  return (
    <main className="flex flex-col gap-5">
      <PageTitle eyebrow="Calendar" title={title} sub={`${appts.length} appointment${appts.length === 1 ? "" : "s"} in view`} action={<Link href={`/admin/calendar/new?d=${d}`} className={btnCls}>Schedule</Link>} />

      <div className="cal-bar">
        <Tabs current={view} items={(["day", "week", "month"] as View[]).map((v) => ({ key: v, label: v, href: href(v, d) }))} />
        <nav className="cal-nav" aria-label="Move through the calendar">
          <Link href={href(view, prev)} aria-label="Previous">‹</Link>
          <Link href={href(view, today)}>Today</Link>
          <Link href={href(view, next)} aria-label="Next">›</Link>
        </nav>
      </div>

      <Legend items={APPOINTMENT_TYPES.map((t) => ({ key: t.key, label: t.label, color: apptColor(t.key) }))} />

      {view === "day" && <Panel title={label(d, { weekday: "long", day: "numeric", month: "long" })}>{dayList(d)}</Panel>}

      {view === "week" && (
        <div className="cal-week">
          {days.map((k) => (
            <section key={k} className={`cal-day ${k === today ? "is-today" : ""}`}>
              <Link href={href("day", k)} className="cal-day-head">
                <span>{label(k, { weekday: "short" })}</span><b>{Number(k.slice(8))}</b>
              </Link>
              {(byDay.get(k) ?? []).length === 0 ? <span className="at-muted text-xs">Free</span> : (byDay.get(k) ?? []).map(event)}
            </section>
          ))}
        </div>
      )}

      {view === "month" && (
        // Tablet/laptop: month grid with the selected day beside it (split view).
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="cal-month lg:flex-1">
            <div className="cal-head">{WEEKDAYS.map((w) => <div key={w}>{w}</div>)}</div>
            <div className="cal-grid">
              {days.map((k) => {
                const list = byDay.get(k) ?? [];
                const inMonth = k.slice(0, 7) === d.slice(0, 7);
                const cls = ["cal-cell", !inMonth && "is-out", isWeekend(k) && "is-weekend", k === today && "is-today", k === d && "is-selected"].filter(Boolean).join(" ");
                return (
                  <Link key={k} href={href("month", k)} className={cls} aria-label={`${label(k, { weekday: "long", day: "numeric", month: "long" })}, ${list.length} appointments`}>
                    <span className="cal-num">{Number(k.slice(8))}</span>
                    {list.slice(0, 3).map((a) => {
                      const c = apptColor(a.type);
                      return <span key={a.id} className="cal-chip" style={{ background: c.bg, color: c.fg }}>{fmtTime(a.startsAt)} {a.client?.name ?? apptLabel(a.type)}</span>;
                    })}
                    {list.length > 3 && <span className="cal-more">+{list.length - 3} more</span>}
                    {list.length > 0 && (
                      <span className="cal-dots" aria-hidden>{list.slice(0, 5).map((a) => <span key={a.id} style={{ background: apptColor(a.type).bg }} />)}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          <aside className="lg:sticky lg:top-6 lg:w-80">
            <Panel eyebrow={d === today ? "Today" : "Selected day"} title={label(d, { weekday: "long", day: "numeric", month: "short" })}>
              {dayList(d)}
            </Panel>
          </aside>
        </div>
      )}
    </main>
  );
}
