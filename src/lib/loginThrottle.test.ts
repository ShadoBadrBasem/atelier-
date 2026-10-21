import { describe, expect, it } from "vitest";
import { LoginThrottle, clientIp } from "./loginThrottle";

describe("login throttle", () => {
  it("blocks after too many failures and recovers after the window", () => {
    const t = new LoginThrottle(3, 1000);
    t.fail("ip", 0);
    t.fail("ip", 10);
    expect(t.blockedFor("ip", 20)).toBe(0);
    t.fail("ip", 30);
    expect(t.blockedFor("ip", 40)).toBe(960);
    expect(t.blockedFor("ip", 1000)).toBe(0);
  });

  it("clears on success and keeps keys apart", () => {
    const t = new LoginThrottle(1, 1000);
    t.fail("a", 0);
    expect(t.blockedFor("b", 1)).toBe(0);
    t.succeed("a");
    expect(t.blockedFor("a", 2)).toBe(0);
  });

  it("prefers the Cloudflare client IP header", () => {
    expect(clientIp(new Headers({ "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("local");
  });
});
