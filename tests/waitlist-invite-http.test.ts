import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { inviteAccessHandler } from "../src/lib/waitlist/invite-handler";
import Invite from "../src/app/waitlist/invite/page";
import { PATCH } from "../src/app/api/waitlist/preferences/route";
describe("retired waitlist entry points", () => {
  it("legacy private invitation links show a generic explanation without exposing a token", async () => {
    const token = "sensitive-legacy-token";
    const page = renderToStaticMarkup(
      await Invite({ searchParams: Promise.resolve({ token }) }),
    );
    expect(page).toContain("future app");
    expect(page).not.toContain(token);
    expect(page).not.toContain("Copy invite");
    const response = await inviteAccessHandler(
      new Request("https://example.com/waitlist/invite/access", {
        method: "POST",
        body: `token=${token}`,
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/waitlist/invite");
    expect(response.headers.get("set-cookie")).not.toContain(token);
  });
  it("legacy preferences no longer collects personal details", async () => {
    const response = await PATCH(
      new Request("https://example.com/api/waitlist/preferences", {
        method: "PATCH",
        body: '{"city":"lagos"}',
      }),
    );
    expect(response.status).toBe(410);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
