import { describe, it, expect } from "vitest";
import { periodKey, readBucket } from "../src/lib/preview/bucket";
describe("browser-only Bucket-list preview", () => {
  it("changes only the relevant recurrence period across month/year boundaries", () => {
    expect(periodKey("weekly", new Date(2027, 0, 3))).toBe("2026-12-28");
    expect(periodKey("weekly", new Date(2027, 0, 4))).toBe("2027-01-04");
    expect(periodKey("monthly", new Date(2026, 11, 31))).toBe("2026-12");
    expect(periodKey("monthly", new Date(2027, 0, 1))).toBe("2027-01");
    expect(periodKey("daily", new Date(2027, 0, 1, 23))).toBe("2027-01-01");
    expect(periodKey("once", new Date(2027, 0, 1))).toBe("once");
  });
  it("handles malformed local storage and rejects broken or duplicate records", () => {
    const valid = {
      id: "my-idea",
      title: "Try salsa",
      group: "move",
      cadence: "weekly",
      completedPeriods: ["2026-09-28"],
    };
    expect(readBucket("broken")).toEqual([]);
    expect(
      readBucket(
        JSON.stringify([
          valid,
          valid,
          { ...valid, id: "bad", cadence: "hourly" },
          { ...valid, id: "bad2", completedPeriods: [null] },
        ]),
      ),
    ).toEqual([valid]);
  });
});
