import type { MetadataRoute } from "next";
import { indexableOrigin } from "@/lib/site-metadata";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = indexableOrigin();
  return origin ? [{ url: origin }] : [];
}
