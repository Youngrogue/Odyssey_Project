import { brand } from "../brand";
export type EmailKind = "confirmation" | "welcome";
export type EmailInput = {
  origin: string;
  token: string;
  unsubscribeToken?: string;
  contactEmail?: string;
};
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function renderWaitlistEmail(kind: EmailKind, input: EmailInput) {
  const confirmation = kind === "confirmation";
  const subject = confirmation
    ? "Your next side quest starts here — confirm your email"
    : "You're on the list. Here's what comes next.";
  const url = confirmation
    ? `${input.origin}/waitlist/confirm?token=${encodeURIComponent(input.token)}`
    : `${input.origin}/#try-something`;
  const label = confirmation ? "Confirm my email" : "Find something to try";
  const paragraphs = confirmation
    ? [
        "Thanks for checking out Odyssey project. We're building a place to discover things worth trying, find people who share your interests, and turn “one day” plans into your own Bucket list.",
        "Think salsa, karaoke, a new cuisine, a games night, or a small adventure at home. Lagos is our starting point for the deepest collection of ideas, alongside Abuja, Ibadan and Port Harcourt.",
        "Once you confirm, we'll welcome you to the list and email you meaningful build updates and a launch notification. We haven't announced a launch date yet.",
        "This link expires in 24 hours. Didn't ask to join? Ignore this email. We won't send project updates unless you confirm.",
      ]
    : [
        "You're on the Odyssey project waitlist. Thanks for being here while we build.",
        "We're bringing together activity ideas, places to try them, communities to discover, and personal Bucket lists you can check off at your own pace.",
        "Try something new: learn a salsa step or cook a new dish. Make a connection: join a games night, book discussion or picnic. Stay in and explore: tackle a chess puzzle, make something, or host a karaoke night.",
        "We'll share meaningful progress and let you know when the app is ready. There's no launch date to promise yet. Joining this list hasn't created an app account or public profile.",
      ];
  const footer = [
    { label: "Privacy notice", url: `${input.origin}/privacy` },
    ...(input.unsubscribeToken
      ? [
          {
            label: "Unsubscribe",
            url: `${input.origin}/waitlist/unsubscribe?token=${encodeURIComponent(input.unsubscribeToken)}`,
          },
        ]
      : []),
    ...(input.contactEmail
      ? [{ label: "Contact the project", url: `mailto:${input.contactEmail}` }]
      : []),
  ];
  return {
    subject,
    text: `Odyssey project\n\nHi there,\n\n${paragraphs.join("\n\n")}\n\n${label}: ${url}\n\n${footer.map((l) => `${l.label}: ${l.url}`).join("\n")}`,
    html: `<!doctype html><html><body style="margin:0;background:#F8FAFC;color:#0F172A;font:16px/1.65 Arial,sans-serif"><main style="max-width:560px;margin:32px auto;padding:32px;background:white"><p style="font-weight:bold;color:#0F172A">${escape(brand.name.toUpperCase())}</p><h1 style="font-size:26px;line-height:1.3">${escape(subject)}</h1><p>Hi there,</p>${paragraphs.map((p) => `<p>${escape(p)}</p>`).join("")}<p><a href="${escape(url)}" style="display:inline-block;background:#FACC15;color:#0F172A;padding:14px 22px;border-radius:8px">${label}</a></p><p>— Odyssey project</p><footer style="font-size:13px">${footer.map((l) => `<a href="${escape(l.url)}" style="color:#4338CA">${l.label}</a>`).join(" · ")}</footer></main></body></html>`,
  };
}
