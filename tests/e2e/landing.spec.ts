import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";

const evidence = path.resolve("../outputs/odyssey-landing-2026-10-01");

for (const width of [320, 390, 768, 1440]) {
  test(`page is usable at ${width}px without early video download`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const videoRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes(".mp4")) videoRequests.push(request.url());
    });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "A lot more life.",
    );
    await expect(
      page.getByRole("textbox", { name: "Your email address" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(videoRequests).toEqual([]);
    await expect(page.locator("video")).toHaveCount(0);
    const violations = (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations;
    expect(
      violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    await page.screenshot({
      path: `${evidence}/landing-${width}.png`,
      fullPage: true,
    });
  });
}

test("invalid input, server failure and retry preserve the signup", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Your email address" });
  const join = page.getByRole("button", {
    name: "Join the waitlist",
    exact: true,
  });
  await input.fill("wrong");
  await join.click();
  await expect(page.locator("#waitlist .form-error[role=alert]")).toContainText(
    "valid email",
  );
  await expect(input).toBeFocused();
  await input.fill("reader+odyssey@example.com");
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 503, json: { ok: false } }),
  );
  await join.click();
  await expect(page.locator("#waitlist .form-error[role=alert]")).toContainText(
    "couldn’t save",
  );
  await expect(input).toHaveValue("reader+odyssey@example.com");
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 200, json: { ok: true } }),
  );
  await join.click();
  await expect(
    page.getByRole("heading", { name: "What’s your kind of fun?" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(
    page.getByRole("heading", { name: "Here’s to your next first." }),
  ).toBeFocused();
});

test("optional preferences and skip remain accessible after a save fails or hangs", async ({
  page,
}) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 200, json: { ok: true } }),
  );
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Your email address" })
    .fill("test@example.com");
  await page
    .getByRole("button", { name: "Join the waitlist", exact: true })
    .click();
  await page.getByLabel("Your city").selectOption("lagos");
  await page.getByLabel("Days at home").check();
  let received: unknown;
  await page.route("**/api/waitlist/preferences", (route) => {
    received = route.request().postDataJSON();
    return route.fulfill({ status: 503, json: { ok: false } });
  });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator("#waitlist .form-error[role=alert]")).toContainText(
    "Your signup is safe",
  );
  expect(received).toEqual({ city: "lagos", interests: ["home"] });
  await page.route("**/api/waitlist/preferences", async () => {
    /* deliberately unresolved; skip must stay usable */
  });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saving…" })).toBeDisabled();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(
    page.getByRole("heading", { name: "Here’s to your next first." }),
  ).toBeVisible();
});

test("preferences can be saved successfully", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 200, json: { ok: true } }),
  );
  await page.route("**/api/waitlist/preferences", (route) =>
    route.fulfill({ status: 200, json: { ok: true } }),
  );
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Your email address" })
    .fill("test@example.com");
  await page
    .getByRole("button", { name: "Join the waitlist", exact: true })
    .click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Here’s to your next first." }),
  ).toBeVisible();
});

test("teaser has keyboard focus, native controls and loads only on request", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page
    .getByText("Watch the original “Break the loop” teaser", { exact: true })
    .click();
  const play = page.getByRole("button", { name: "Watch the 40-second teaser" });
  await play.focus();
  await expect(play).toBeFocused();
  await expect(page.locator(".brand-film-details .teaser-player")).toHaveCSS(
    "outline-style",
    "solid",
  );
  await play.press("Enter");
  await expect(page.locator("video")).toBeFocused();
  await expect(page.locator("video")).toHaveAttribute("controls", "");
  await expect
    .poll(() =>
      page.locator("video").evaluate((el: HTMLVideoElement) => el.readyState),
    )
    .toBeGreaterThan(0);
});

test("reduced motion, reflow, privacy and FAQ remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await page.getByText("Is it only for going out?", { exact: true }).click();
  await expect(
    page.getByText("Absolutely not.", { exact: false }),
  ).toBeVisible();
  // 200% text-size stress test supplements the narrow-viewport reflow checks.
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await page.screenshot({
    path: `${evidence}/text-zoom-200.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { name: "A small signup. A clear purpose." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "test@example.com" }),
  ).toHaveAttribute("href", "mailto:test@example.com");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
});

test("real endpoint returns failure when storage is unavailable", async ({
  request,
}) => {
  const response = await request.post("/api/waitlist", {
    headers: { origin: "http://127.0.0.1:43218" },
    data: { email: "test@example.com", website: "" },
  });
  expect(response.status()).toBe(503);
  expect(await response.json()).toMatchObject({ ok: false });
});

test("unconfigured preview disables collection and explains privacy", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 1020 });
  await page.goto("http://127.0.0.1:43217");
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.getByRole("button", { name: "Join the waitlist", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Preview — signups aren’t open yet.", { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: `${evidence}/preview-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${evidence}/preview-mobile.png` });
  const response = await request.post("http://127.0.0.1:43217/api/waitlist", {
    headers: { origin: "http://127.0.0.1:43217" },
    data: { email: "test@example.com", website: "" },
  });
  expect(response.status()).toBe(503);
  await page.getByRole("link", { name: "About your privacy" }).click();
  await expect(
    page.getByText("This is a preview.", { exact: false }),
  ).toBeVisible();
});

test("throttled mobile starts with text and no MP4 request", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const session = await context.newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 200 * 1024,
    uploadThroughput: 100 * 1024,
  });
  const videoRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp4")) videoRequests.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Your email address" }),
  ).toBeEnabled();
  expect(videoRequests).toEqual([]);
  const loading = await page.evaluate(() => ({
    resources: performance.getEntriesByType("resource").map((r) => ({
      name: r.name.split("/").at(-1),
      bytes: (r as PerformanceResourceTiming).transferSize,
    })),
    paints: performance
      .getEntriesByType("paint")
      .map((p) => ({ name: p.name, ms: Math.round(p.startTime) })),
  }));
  await test.info().attach("throttled-mobile-loading", {
    body: JSON.stringify(loading, null, 2),
    contentType: "application/json",
  });
});
