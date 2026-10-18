import { describe, expect, it } from "vitest";
import { assertSafeDomainChangeset } from "../scripts/cloudflare-domain-preflight.mjs";

const hostname = "odyssey.soralives.xyz";
const clean = () => ({
  success: true,
  result: { added: [], removed: [], updated: [], conflicting: [] },
});
describe("domain changeset before deployment", () => {
  it("allows only a new exact hostname or an unchanged existing attachment", () => {
    expect(() => assertSafeDomainChangeset(clean(), hostname)).not.toThrow();
    expect(() =>
      assertSafeDomainChangeset(
        { ...clean(), result: { ...clean().result, added: [{ hostname }] } },
        hostname,
      ),
    ).not.toThrow();
    expect(() =>
      assertSafeDomainChangeset(
        {
          ...clean(),
          result: {
            ...clean().result,
            updated: [{ hostname, modified: false }],
          },
        },
        hostname,
      ),
    ).not.toThrow();
  });
  it("rejects unknown responses, removals, DNS conflicts and changed ownership", () => {
    const cases = [
      null,
      {},
      { success: false, result: clean().result },
      { success: true, result: {} },
      ...["removed", "conflicting"].map((key) => ({
        ...clean(),
        result: { ...clean().result, [key]: [{ hostname }] },
      })),
      {
        ...clean(),
        result: {
          ...clean().result,
          added: [{ hostname: "other.soralives.xyz" }],
        },
      },
      {
        ...clean(),
        result: { ...clean().result, updated: [{ hostname, modified: true }] },
      },
      { ...clean(), result: { ...clean().result, updated: [{ hostname }] } },
    ];
    for (const payload of cases)
      expect(() => assertSafeDomainChangeset(payload, hostname)).toThrow();
  });
});
