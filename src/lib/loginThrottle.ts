// Slows down password guessing once the Atelier is on the internet.
// In memory: one server process, and a restart only resets the counters.

const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 5;

interface Entry {
  failures: number;
  first: number;
}

export class LoginThrottle {
  private entries = new Map<string, Entry>();

  constructor(private max = MAX_FAILURES, private windowMs = WINDOW_MS) {}

  /** Milliseconds until `key` may try again, or 0 when allowed. */
  blockedFor(key: string, now = Date.now()): number {
    const e = this.entries.get(key);
    if (!e) return 0;
    if (now - e.first >= this.windowMs) {
      this.entries.delete(key);
      return 0;
    }
    return e.failures >= this.max ? this.windowMs - (now - e.first) : 0;
  }

  fail(key: string, now = Date.now()) {
    const e = this.entries.get(key);
    if (!e || now - e.first >= this.windowMs) this.entries.set(key, { failures: 1, first: now });
    else e.failures++;
  }

  succeed(key: string) {
    this.entries.delete(key);
  }
}

export const loginThrottle = new LoginThrottle();

/** Client IP behind Cloudflare Tunnel, falling back to the usual proxy header. */
export function clientIp(headers: Headers): string {
  return headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}
