export const runtime = "nodejs";
export async function PATCH(_request: Request): Promise<Response> {
  return Response.json(
    { ok: false, error: "Waitlist preferences are no longer collected" },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie":
          "odyssey_waitlist_cap=; Max-Age=0; Path=/api/waitlist/preferences; HttpOnly; SameSite=Strict",
      },
    },
  );
}
