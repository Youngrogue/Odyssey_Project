import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const preview = "http://127.0.0.1:43217";
test("mobile discovery has keyboard controls and a complete View all alternative", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const controls = page.getByRole("group", { name: "Browse activity ideas" });
  await expect(controls).toContainText("1 / 6");
  const next = page.getByRole("button", { name: "Next activity idea" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(controls).toContainText("2 / 6");
  await page.getByRole("button", { name: "View all 18 ideas" }).click();
  await expect(page.locator(".idea-card")).toHaveCount(18);
  await expect(controls).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("ideas filter, detail dialog, save, custom recurrence, completion, persistence and removal", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Stay in", exact: true }).click();
  await expect(page.locator(".idea-card")).toHaveCount(3);
  const explore = page.getByRole("button", {
    name: "Explore idea: A small challenge. A cosy evening.",
  });
  await explore.click();
  await expect(
    page.getByRole("dialog", { name: "A small challenge. A cosy evening." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add to my Bucket list", exact: true })
    .click();
  await expect(explore).toBeFocused();
  await expect(page.locator(".bucket-items li")).toHaveCount(1);
  await page.getByLabel("An idea of your own").fill("A weekly dance break");
  await page.getByLabel("Make time for it").selectOption("weekly");
  await page.getByLabel("Category", { exact: true }).selectOption("move");
  await page.getByRole("button", { name: "Add idea", exact: true }).click();
  await expect(page.locator(".bucket-items li")).toHaveCount(2);
  await page.getByRole("checkbox", { name: /A weekly dance break/ }).click();
  await expect(
    page.getByRole("checkbox", { name: /A weekly dance break/ }),
  ).toBeChecked();
  await expect(page.locator(".bucket-progress")).toContainText(
    "1 checked off · 2 ideas",
  );
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: /A weekly dance break/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Weekly", exact: true }).click();
  await expect(page.locator(".bucket-items li")).toHaveCount(1);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my list" }).click();
  expect((await download).suggestedFilename()).toBe(
    "my-odyssey-bucket-list.txt",
  );
  await page
    .getByRole("button", { name: "Clear my list", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep it", exact: true }).click();
  await expect(page.locator(".bucket-progress")).toContainText("2 ideas");
  await page
    .getByRole("button", { name: "Remove A weekly dance break" })
    .click();
  await expect(page.locator(".bucket-progress")).toContainText(
    "0 checked off · 1 ideas",
  );
});
test("closed signups cannot collect or submit email", async ({ page }) => {
  const api: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/")) api.push(r.url());
  });
  await page.goto(preview);
  await expect(
    page.getByText("Signups are opening soon.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Your email address", { exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Notify me at launch", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(api).toEqual([`${preview}/api/waitlist/status`]);
});
test("partner introduction is local, downloadable and never pretends to send", async ({
  page,
}) => {
  await page.goto(preview);
  await page.getByLabel("Your name", { exact: true }).fill("Preview host");
  await page.getByLabel("Community, venue or brand").fill("A sample book club");
  await page
    .getByLabel("A little about your idea")
    .fill("An open monthly reading afternoon.");
  await page.getByRole("button", { name: "Prepare my introduction" }).click();
  await expect(
    page.getByLabel("Prepared partnership introduction"),
  ).toContainText("A sample book club");
  await expect(
    page.getByRole("link", { name: "Open email draft" }),
  ).toHaveAttribute("href", /^mailto:odyssey@soralives\.xyz\?/);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download draft", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "odyssey-partner-enquiry.txt",
  );
});
test("both films use native controls, stay deferred and pause one another", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("video")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Watch the 20-second Odyssey film" })
    .click();
  const portrait = page.locator(".portrait-player video");
  await expect
    .poll(() => portrait.evaluate((v: HTMLVideoElement) => v.readyState))
    .toBeGreaterThan(1);
  await portrait.evaluate((v: HTMLVideoElement) => v.play());
  await page
    .getByText("Watch the original “Break the loop” teaser", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Watch the 40-second teaser" })
    .click();
  const landscape = page.locator(".brand-film-details video");
  await expect
    .poll(() => landscape.evaluate((v: HTMLVideoElement) => v.readyState))
    .toBeGreaterThan(1);
  await landscape.evaluate((v: HTMLVideoElement) => v.play());
  await expect
    .poll(() => portrait.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await portrait.evaluate((v: HTMLVideoElement) => v.play());
  await expect
    .poll(() => landscape.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await landscape.evaluate((v: HTMLVideoElement) => v.play());
  await page
    .getByText("Watch the original “Break the loop” teaser", { exact: true })
    .click();
  await expect
    .poll(() => landscape.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
});
test("storage failure is honest and list still works for the visit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("storage denied");
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Add: Find your rhythm. Try salsa." })
    .click();
  await expect(
    page.getByText("Browser storage isn’t available.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".bucket-items li")).toHaveCount(1);
});
test("isometric community selection and opened activity detail remain accessible on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const games = page.locator(".community-card").nth(1);
  await games
    .getByRole("button", { name: "See shared interests", exact: true })
    .click();
  await expect(games.locator(".community-leads")).toBeVisible();
  await expect(page.locator("#community-paths-0")).not.toBeVisible();
  await expect(games.getByText("Board games", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Explore idea: Find your rhythm. Try salsa." })
    .click();
  const violations = (
    await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
  ).violations;
  expect(
    violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("preview lists stay consistent across two tabs, including clear and simultaneous additions", async ({
  page,
  context,
}) => {
  await page.goto("/");
  const other = await context.newPage();
  await other.goto("/");
  await page
    .getByRole("button", { name: "Add: Find your rhythm. Try salsa." })
    .click();
  await expect(other.locator(".bucket-items li")).toHaveCount(1);
  await Promise.all([
    page
      .getByRole("button", {
        name: "Add: Make something with your hands.",
      })
      .click(),
    other
      .getByRole("button", { name: "Add: Taste a country you haven’t tried." })
      .click(),
  ]);
  await expect(page.locator(".bucket-items li")).toHaveCount(3);
  await expect(other.locator(".bucket-items li")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Clear my list", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Yes, clear it", exact: true })
    .click();
  await expect(other.locator(".bucket-items li")).toHaveCount(0);
  await other
    .getByRole("button", { name: "Add: Find your rhythm. Try salsa." })
    .click();
  await page.reload();
  await expect(page.locator(".bucket-items li")).toHaveCount(1);
  await other.close();
});

test("copy failure gives a usable alternative for partnership drafts", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Permission denied");
        },
      },
      configurable: true,
    }),
  );
  await page.goto(preview);
  await page.getByLabel("Your name", { exact: true }).fill("Sample host");
  await page.getByLabel("Community, venue or brand").fill("Sample club");
  await page
    .getByLabel("A little about your idea")
    .fill("A reading afternoon.");
  await page.getByRole("button", { name: "Prepare my introduction" }).click();
  await page.getByRole("button", { name: "Copy text", exact: true }).click();
  await expect(
    page.getByText("Copy wasn’t available.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download draft", exact: true }),
  ).toBeEnabled();
});

test("email action pages are accessible and opening them does not submit", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") mutations.push(r.url());
  });
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of [
    "/waitlist/confirm?token=" + "a".repeat(43),
    "/waitlist/confirm?resent=1",
    "/waitlist/unsubscribe?token=" + "b".repeat(43),
    "/waitlist/invite?token=" + "c".repeat(43),
    "/waitlist/invite",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations.map((v) => v.id),
    ).toEqual([]);
  }
  expect(mutations).toEqual([]);
});
