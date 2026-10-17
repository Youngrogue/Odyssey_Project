import { afterEach, expect, it, vi } from "vitest";
import { landingMetadata, indexableOrigin } from "../src/lib/site-metadata";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";
afterEach(() => vi.unstubAllEnvs());

it("only indexes the configured public production landing after explicit enablement", () => {
  vi.stubEnv("APP_ORIGIN", "https://odyssey.example");
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  vi.stubEnv("DEPLOYMENT_ENV", "preview");
  expect(indexableOrigin()).toBeNull();
  expect(landingMetadata().alternates).toBeUndefined();
  expect(sitemap()).toEqual([]);
  vi.stubEnv("DEPLOYMENT_ENV", "production");
  expect(indexableOrigin()).toBe("https://odyssey.example");
  expect(landingMetadata().alternates?.canonical).toBe(
    "https://odyssey.example",
  );
  expect(robots().rules).toEqual({
    userAgent: "*",
    allow: "/",
    disallow: ["/api/", "/waitlist/"],
  });
  expect(sitemap()).toEqual([{ url: "https://odyssey.example" }]);
  vi.stubEnv("SITE_INDEXING_ENABLED", "false");
  expect(landingMetadata().robots).toEqual({ index: false, follow: false });
  expect(sitemap()).toEqual([]);
});

it.each([
  "http://odyssey.example",
  "https://localhost",
  "https://127.0.0.1",
  "https://test.localhost",
  "https://name:secret@odyssey.example",
  "https://odyssey.example/path",
  "https://odyssey.example?token=secret",
  "not-a-url",
])("never advertises invalid or local public origin %s", (origin) => {
  vi.stubEnv("DEPLOYMENT_ENV", "production");
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  vi.stubEnv("APP_ORIGIN", origin);
  expect(indexableOrigin()).toBeNull();
  expect(landingMetadata().openGraph).toBeUndefined();
});
