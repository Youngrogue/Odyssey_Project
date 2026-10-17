import type { Metadata } from "next";
import { brand } from "./brand";

export function productionOrigin(): string | null {
  // Set at build time; staging builds must never advertise production indexing.
  if (process.env.DEPLOYMENT_ENV !== "production") return null;
  try {
    const url = new URL(process.env.APP_ORIGIN ?? "");
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.hostname.endsWith(".localhost")
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function indexableOrigin(): string | null {
  return process.env.SITE_INDEXING_ENABLED === "true"
    ? productionOrigin()
    : null;
}

export function landingMetadata(): Metadata {
  const origin = productionOrigin();
  const index = Boolean(indexableOrigin());
  return {
    robots: { index, follow: index },
    ...(origin
      ? {
          metadataBase: new URL(origin),
          alternates: { canonical: origin },
          openGraph: {
            type: "website",
            url: origin,
            siteName: brand.name,
            title: brand.title,
            description: brand.description,
            images: [
              {
                url: `${origin}/illustrations/odyssey-world-1000.webp`,
                alt: "Odyssey: a colourful world of activities, at home and around the city",
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            title: brand.title,
            description: brand.description,
            images: [`${origin}/illustrations/odyssey-world-1000.webp`],
          },
        }
      : {}),
  };
}
