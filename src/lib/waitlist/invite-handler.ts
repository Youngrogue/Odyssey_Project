export async function inviteAccessHandler(_request: Request) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/waitlist/invite",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      "Set-Cookie":
        "odyssey_invite_access=; Path=/waitlist/invite; Max-Age=0; HttpOnly; SameSite=Lax; Secure",
    },
  });
}
