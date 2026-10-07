import { describe, expect, it } from "vitest";
import { readBoundedJson } from "../src/lib/waitlist/http";

describe("waitlist HTTP body", () => {
  it("rejects non-JSON and oversized bodies before parsing", async () => {
    await expect(
      readBoundedJson(
        new Request("https://odyssey.example/api/waitlist", {
          method: "POST",
          body: "{}",
          headers: { "content-type": "text/plain" },
        }),
      ),
    ).rejects.toThrow();
    await expect(
      readBoundedJson(
        new Request("https://odyssey.example/api/waitlist", {
          method: "POST",
          body: JSON.stringify({ email: "a".repeat(3000) }),
          headers: { "content-type": "application/json" },
        }),
      ),
    ).rejects.toThrow();
  });

  it("parses a valid small JSON body", async () => {
    await expect(
      readBoundedJson(
        new Request("https://odyssey.example/api/waitlist", {
          method: "POST",
          body: '{"email":"a@example.com"}',
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
      ),
    ).resolves.toEqual({ email: "a@example.com" });
  });
});
