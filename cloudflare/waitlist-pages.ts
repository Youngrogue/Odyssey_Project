const validToken = (value: string | null) =>
  value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
export function renderWaitlistPage(url: URL) {
  const invite = url.pathname === "/waitlist/invite";
  const confirm = url.pathname === "/waitlist/confirm";
  const title = invite
    ? "Keep exploring Odyssey"
    : confirm
      ? "Confirm your email"
      : "Unsubscribe";
  const params = url.searchParams,
    token = validToken(params.get("token"));
  const error = params.get("error");
  const errorText =
    error === "limited"
      ? "Too many attempts. Please try again later."
      : error === "unavailable"
        ? "This action is temporarily unavailable. Please try again later."
        : error === "expired"
          ? "This confirmation link has expired, has already been used or is no longer valid. Request a new one below if needed."
          : "We could not process that request. Please use your email link or request a new one.";
  let body = "";
  if (invite)
    body =
      '<p>Invitations and early-member recognition are planned for the future app. The waitlist now uses only your email address.</p><p>If you previously confirmed your email, no further action is needed.</p><a href="/#waitlist">Visit the waitlist</a>';
  else {
    if (error) body += `<p role="alert">${errorText}</p>`;
    if (params.has("resent"))
      body +=
        "<p>Request saved. If this address can receive a new confirmation link, we will send one. Delivery may take a few minutes.</p>";
    // An error always wins: conflicting flags must never also claim success.
    if (params.has("done") && !error)
      body += confirm
        ? "<p>You're on the list. You'll be among the first to hear when Odyssey launches.</p>"
        : "<p>Request processed. A valid link stops future waitlist emails. A message already being sent may still arrive.</p>";
    else {
      body += confirm
        ? "<p>Open your email link and choose the button below to confirm that you want a launch notification. Opening this page alone does not subscribe you.</p>"
        : "<p>No account or sign-in is needed. Choose below to stop future waitlist emails.</p>";
      if (token)
        body += `<form action="/api/waitlist/${confirm ? "confirm" : "unsubscribe"}" method="post"><input type="hidden" name="token" value="${token}"><button type="submit">${confirm ? "Confirm my email" : "Unsubscribe me"}</button></form>`;
      else if (!confirm)
        body += "<p>Use the unsubscribe link in your email.</p>";
    }
    if (confirm)
      body +=
        '<p><a href="/#activity-ideas">Return to exploring Odyssey</a></p><h2>Need a new link?</h2><p>Confirmation links expire after 24 hours. If this address can receive another link, we will queue one.</p><form action="/api/waitlist/resend" method="post"><label for="email">Email</label><input id="email" type="email" name="email" autocomplete="email" required maxlength="254"><input type="hidden" name="website" value=""><button type="submit">Request a new link</button></form>';
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>${title} · Odyssey</title><link rel="stylesheet" href="/waitlist-shell.css"></head><body><main><a class="brand" href="/"><img src="/brand/open-loop-ink.png" alt="" width="40" height="40">Odyssey</a><h1>${title}</h1>${body}<p><a href="/privacy">Privacy notice</a></p></main></body></html>`;
}
