import { expect, test } from "@playwright/test";
import { ideas } from "../../src/lib/preview/ideas";
import { rewardPreviews } from "../../src/lib/preview/rewards";

test("every idea connects to a distinct activity preview without granting or posting rewards", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/")) requests.push(request.url());
  });
  await page.goto("/");
  const section = page.locator("#your-progress");
  await expect(section.locator(".foodie-example > strong")).toBeVisible();
  await section
    .getByText("Your passport to the next rank", { exact: true })
    .click();
  await expect(
    section.getByText(/Try food from any 5 countries/),
  ).toBeVisible();
  for (const idea of ideas) {
    await page.getByLabel("Pick your next obsession").selectOption(idea.id);
    await expect(page.locator("#leaderboard-preview-title")).toHaveText(
      rewardPreviews[idea.id].label,
    );
    await expect(page.locator("#trophy-preview-title")).toHaveText(
      rewardPreviews[idea.id].family,
    );
    await expect(section.locator(".sample-standings")).toContainText("2,543");
  }
  await section.getByRole("button", { name: "All time", exact: true }).click();
  await expect(section.locator(".sample-standings")).toContainText("18,543");
  await section
    .getByRole("button", { name: "This month", exact: true })
    .click();
  await expect(section.locator(".sample-standings")).toContainText("2,543");
  await page
    .getByRole("button", { name: "Add: Find your rhythm. Try salsa." })
    .click();
  await page
    .getByRole("checkbox", { name: /Find your rhythm. Try salsa./ })
    .click();
  await expect(
    page.getByRole("checkbox", { name: /Find your rhythm. Try salsa./ }),
  ).toBeChecked();
  await expect(section.locator(".sample-standings")).toContainText("2,543");
  await section
    .getByRole("button", { name: "My own pace", exact: true })
    .click();
  await expect(section.getByText("Your pace is enough.")).toBeVisible();
  await expect(section.locator(".sample-standings")).toHaveCount(0);
  await page.reload();
  await expect(
    section.getByRole("button", { name: "The leaderboard", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(requests.length).toBeGreaterThan(0);
  expect(
    requests.every((url) => new URL(url).pathname === "/api/waitlist/status"),
  ).toBe(true);
});

test("activity detail navigates to its reward preview and moves keyboard focus", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore idea: Find your rhythm. Try salsa." })
    .click();
  await page
    .getByRole("button", { name: "See trophies & leaderboards" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByLabel("Pick your next obsession")).toHaveValue(
    "salsa",
  );
  await expect(page.locator("#rewards-title")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Pick your next obsession")).toBeFocused();
});

test("previews and email action routes remain excluded from indexing", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/privacy",
    "/waitlist/confirm",
    "/waitlist/unsubscribe",
    "/waitlist/invite",
  ]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  }
  const robots = await page.request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /");
  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).not.toContain("<loc>");
});

test("every reward family reflows at 320px with 200% text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page.addStyleTag({ content: "html {font-size:200% !important}" });
  for (const idea of ideas) {
    await page.getByLabel("Pick your next obsession").selectOption(idea.id);
    const bounds = await page
      .locator("#your-progress")
      .evaluate((e) => ({ width: e.clientWidth, scroll: e.scrollWidth }));
    expect(bounds.scroll, idea.id).toBeLessThanOrEqual(bounds.width);
  }
});
