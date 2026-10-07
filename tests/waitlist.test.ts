import { describe, expect, it } from "vitest";
import {
  parseSignup,
  parsePreferences,
  isAllowedOrigin,
  getRateLimitClientIp,
} from "../src/lib/waitlist/validation";

describe("waitlist input", () => {
  it("normalizes a valid email and rejects payloads that exceed the bounded contract", () => {
    expect(
      parseSignup({ email: "  Person@Example.COM  ", website: "" }),
    ).toEqual({ email: "person@example.com", honeypot: false });
    expect(() => parseSignup({ email: "no-at-sign", website: "" })).toThrow();
    expect(() =>
      parseSignup({ email: "a@example.com", website: "", extra: "x" }),
    ).toThrow();
    expect(() =>
      parseSignup({ email: "a".repeat(250) + "@example.com", website: "" }),
    ).toThrow();
  });

  it("recognizes honeypot submissions without storing them", () => {
    expect(parseSignup({ email: "a@example.com", website: "robot" })).toEqual({
      email: "a@example.com",
      honeypot: true,
    });
  });

  it("rejects malformed DNS labels and controls while retaining ordinary plus and dot addresses", () => {
    expect(
      parseSignup({
        email: " First.Last+events@Example-Place.COM ",
        website: "",
      }).email,
    ).toBe("first.last+events@example-place.com");
    for (const email of [
      "a@b..com",
      "a@-b.com",
      "a@b/com.example",
      "a@b-.com",
      "a..b@example.com",
      ".a@example.com",
      "a@example.com\n",
    ]) {
      expect(() => parseSignup({ email, website: "" })).toThrow();
    }
  });

  it("ignores spoofed IP headers by default and accepts only one configured single-IP header", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.1",
      "x-forwarded-for": "198.51.100.2, 198.51.100.3",
    });
    expect(getRateLimitClientIp(headers, null)).toBe("unknown");
    expect(getRateLimitClientIp(headers, "x-real-ip")).toBe("198.51.100.1");
    expect(getRateLimitClientIp(headers, "x-forwarded-for")).toBe("unknown");
    expect(
      getRateLimitClientIp(
        new Headers({ "x-real-ip": "198.51.100.1, 198.51.100.2" }),
        "x-real-ip",
      ),
    ).toBe("unknown");
  });

  it("accepts only documented preference IDs and small arrays", () => {
    expect(
      parsePreferences({ city: "lagos", interests: ["food", "arts"] }),
    ).toEqual({ city: "lagos", interests: ["food", "arts"] });
    expect(() =>
      parsePreferences({ city: "unknown", interests: [] }),
    ).toThrow();
    expect(() =>
      parsePreferences({ city: "lagos", interests: ["food", "food"] }),
    ).toThrow();
    expect(() =>
      parsePreferences({ city: "lagos", interests: ["unknown"] }),
    ).toThrow();
  });

  it("requires an exact browser origin or a matching same-origin referer", () => {
    expect(
      isAllowedOrigin(
        "https://odyssey.example",
        null,
        "https://odyssey.example",
      ),
    ).toBe(true);
    expect(
      isAllowedOrigin(
        null,
        "https://odyssey.example/page",
        "https://odyssey.example",
      ),
    ).toBe(true);
    expect(
      isAllowedOrigin(
        "https://odyssey.example.evil.test",
        null,
        "https://odyssey.example",
      ),
    ).toBe(false);
    expect(isAllowedOrigin("null", null, "https://odyssey.example")).toBe(
      false,
    );
    expect(isAllowedOrigin(null, null, "https://odyssey.example")).toBe(false);
    expect(
      isAllowedOrigin(
        "https://evil.test",
        "https://odyssey.example/page",
        "https://odyssey.example",
      ),
    ).toBe(false);
  });
});
