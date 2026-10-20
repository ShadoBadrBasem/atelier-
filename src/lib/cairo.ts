// Everything is stored in UTC and displayed/entered in Africa/Cairo.
export const TZ = "Africa/Cairo";

const dtf = (opts: Intl.DateTimeFormatOptions, locale = "en-GB") =>
  new Intl.DateTimeFormat(locale, { timeZone: TZ, ...opts });

export const fmtDate = (d: Date | string | null | undefined, locale = "en-GB") =>
  d ? dtf({ day: "numeric", month: "short", year: "numeric" }, locale).format(new Date(d)) : "";
export const fmtTime = (d: Date | string, locale = "en-GB") =>
  dtf({ hour: "2-digit", minute: "2-digit", hour12: false }, locale).format(new Date(d));
export const fmtDateTime = (d: Date | string | null | undefined, locale = "en-GB") =>
  d ? `${fmtDate(d, locale)} ${fmtTime(d, locale)}` : "";
export const fmtWeekday = (d: Date | string) =>
  dtf({ weekday: "short", day: "numeric", month: "short" }).format(new Date(d));

function parts(d: Date) {
  const p = Object.fromEntries(
    dtf({ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, hourCycle: "h23" }, "en-CA")
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute };
}

/** "YYYY-MM-DD" of the Cairo calendar day. */
export function dayKey(d: Date): string {
  const p = parts(d);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Date -> value for <input type="datetime-local"> in Cairo time. */
export function toInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  const p = parts(d);
  const z = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${z(p.m)}-${z(p.d)}T${z(p.h)}:${z(p.min)}`;
}
export const toDateInput = (d: Date | null | undefined) => (d ? dayKey(d) : "");

/** "YYYY-MM-DDTHH:mm" (Cairo wall time) -> UTC Date. Handles Egypt's DST. */
export function parseCairo(local: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(local);
  if (!m) return null;
  const [y, mo, d, h = "0", mi = "0"] = m.slice(1);
  const wall = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  let guess = wall;
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(guess));
    const seen = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
    guess += wall - seen;
  }
  const out = new Date(guess);
  return isNaN(out.getTime()) ? null : out;
}

export const startOfDay = (key: string) => parseCairo(key)!;
export function addDaysKey(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}
export const todayKey = () => dayKey(new Date());
