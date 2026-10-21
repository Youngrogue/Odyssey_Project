import { test, expect } from "@playwright/test";
for (const query of [
  "?ref=abcdEFGH1234_-56",
  "?ref=bad!",
  "?ref=abcdefghijklmnop&ref=qrstuvwxyzABCDEF",
]) {
  test(`legacy invitation parameter is ignored: ${query}`, async ({ page }) => {
    let submitted: Record<string, unknown> | undefined;
    await page.route("**/api/waitlist", async (route) => {
      submitted = route.request().postDataJSON();
      await route.fulfill({ status: 200, json: { ok: true } });
    });
    await page.goto(`/${query}#waitlist`);
    await page
      .getByLabel("Your email address", { exact: true })
      .fill("new-explorer@example.com");
    await expect(page.getByLabel("Invite code", { exact: false })).toHaveCount(
      0,
    );
    await page
      .getByRole("button", { name: "Notify me at launch", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Check your inbox to confirm your place.",
      }),
    ).toBeVisible();
    expect(submitted).toEqual({
      email: "new-explorer@example.com",
      website: "",
    });
  });
}
test("legacy private invitation page exposes no private state", async ({
  page,
}) => {
  await page.goto("/waitlist/invite?token=private-legacy-token");
  await expect(
    page.getByRole("heading", { name: "Keep exploring Odyssey" }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("private-legacy-token");
  await expect(page.locator("body")).toContainText("future app");
});
