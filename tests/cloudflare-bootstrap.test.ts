import { describe, expect, it } from "vitest";
import { schedulerBootstrapRequired } from "../scripts/cloudflare-bootstrap.mjs";

describe("one-time coordinator deployment", () => {
  it("bootstraps only a confirmed missing script with collection closed", () => {
    const missing = { success: false, errors: [{ code: 10007 }] };
    expect(schedulerBootstrapRequired(404, missing, false)).toBe(true);
    expect(
      schedulerBootstrapRequired(
        404,
        { success: false, errors: [{ code: 10222 }] },
        false,
      ),
    ).toBe(true);
    expect(() =>
      schedulerBootstrapRequired(404, { errors: [{ code: 10222 }] }, true),
    ).toThrow("keep collection closed");
    expect(() => schedulerBootstrapRequired(404, missing, true)).toThrow(
      "keep collection closed",
    );
    for (const status of [401, 403, 429, 500])
      expect(() => schedulerBootstrapRequired(status, missing, false)).toThrow(
        "bootstrap refused",
      );
    expect(() => schedulerBootstrapRequired(404, null, false)).toThrow(
      "bootstrap refused",
    );
    expect(() =>
      schedulerBootstrapRequired(404, { errors: [{ code: 10090 }] }, false),
    ).toThrow("bootstrap refused");
  });
  it("preserves a deployed scheduler and refuses unexpected legacy state", () => {
    expect(
      schedulerBootstrapRequired(
        200,
        {
          success: true,
          result: {
            bindings: [
              { type: "durable_object_namespace", name: "MAIL_RECOVERY" },
            ],
          },
        },
        true,
      ),
    ).toBe(false);
    expect(() =>
      schedulerBootstrapRequired(
        200,
        { success: true, result: { bindings: [] } },
        false,
      ),
    ).toThrow("preserve it and review migration");
  });
});
