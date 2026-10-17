import { test, expect } from "@playwright/test";

test("invite links carry attribution into a new signup without exposing a private dashboard", async ({
  page,
}) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/api/waitlist", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.goto("/?ref=abcdEFGH1234_-56#waitlist");
  await page
    .getByLabel("Your email address", { exact: true })
    .fill("new-explorer@example.com");
  await page
    .getByRole("button", { name: "Join the waitlist", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "What’s your kind of fun?" }),
  ).toBeVisible();
  expect(submitted).toMatchObject({
    email: "new-explorer@example.com",
    referralCode: "abcdEFGH1234_-56",
  });
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page.getByText(/your own invite link to share/)).toBeVisible();
  await page.goto("/waitlist/invite?ref=abcdEFGH1234_-56");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("abcdEFGH1234_-56");
  await expect(page.locator(".invite-share-link")).toHaveCount(0);
});

test("malformed referral query does not stop a direct signup", async ({
  page,
}) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/api/waitlist", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.goto("/?ref=bad!");
  await page
    .getByLabel("Your email address", { exact: true })
    .fill("direct@example.com");
  await page
    .getByRole("button", { name: "Join the waitlist", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "What’s your kind of fun?" }),
  ).toBeVisible();
  expect(submitted).toMatchObject({ email: "direct@example.com" });
  expect(submitted).not.toHaveProperty("referralCode");
});

test("a visitor can enter an invite code without a referral URL", async ({
  page,
}) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/api/waitlist", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 202, json: { ok: true } });
  });
  await page.goto("/");
  await page.getByText("Have an invite code?", { exact: true }).click();
  await page
    .getByLabel("Invite code", { exact: false })
    .fill("abcdEFGH1234_-56");
  await page
    .getByLabel("Your email address", { exact: true })
    .fill("with-code@example.com");
  await page
    .getByRole("button", { name: "Join the waitlist", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "What’s your kind of fun?" }),
  ).toBeVisible();
  expect(submitted).toMatchObject({ referralCode: "abcdEFGH1234_-56" });
});
