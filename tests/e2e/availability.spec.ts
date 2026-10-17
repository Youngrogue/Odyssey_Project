import { test, expect } from "@playwright/test";
test("static signup checks runtime status and recovers without losing an invitation", async ({
  page,
}) => {
  let retry = false;
  await page.route("**/api/waitlist/status", (route) =>
    route.fulfill(
      retry
        ? { status: 200, json: { enabled: true } }
        : { status: 503, json: {} },
    ),
  );
  await page.goto("/?ref=abcdefghijklmnop");
  await expect(
    page.getByText("We couldn’t check signups.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Your email address" }),
  ).toBeDisabled();
  retry = true;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Your email address" }),
  ).toBeEnabled();
  await expect(page.getByLabel("Invite code", { exact: false })).toHaveValue(
    "abcdefghijklmnop",
  );
});
test("repeated or malformed referral parameters do not prefill a code", async ({
  page,
}) => {
  await page.goto("/?ref=abcdefghijklmnop&ref=qrstuvwxyzABCDEF");
  await page.getByText("Have an invite code?", { exact: true }).click();
  await expect(page.getByLabel("Invite code", { exact: false })).toHaveValue(
    "",
  );
});
