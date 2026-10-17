import type { MetadataRoute } from "next";
import { indexableOrigin } from "@/lib/site-metadata";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  const origin = indexableOrigin();
  return origin
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: ["/api/", "/waitlist/"],
        },
        sitemap: `${origin}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
