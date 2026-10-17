import { isWaitlistEnabled } from "@/lib/waitlist/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return Response.json(
    { enabled: isWaitlistEnabled() },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
