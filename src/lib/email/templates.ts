import { brand } from "../brand";
export type EmailKind = "confirmation" | "welcome";
export type EmailInput = {
  origin: string;
  token: string;
  unsubscribeToken?: string;
  contactEmail?: string;
  inviteToken?: string;
  referralCode?: string;
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
  if (kind !== "confirmation") throw new Error("Welcome emails are retired");
  const subject = "Confirm your place on the Odyssey waitlist";
  const url = `${input.origin}/waitlist/confirm?token=${encodeURIComponent(input.token)}`;
  const label = "Confirm my email";
  const paragraphs = [
    "Your next adventure starts with a little curiosity.",
    "Odyssey will help you discover activities, find your people and turn things you've always wanted to try into side quests.",
    "Confirm your email below to join the waitlist. You'll be among the first to hear when Odyssey launches.",
    "This link expires in 24 hours. Didn't request this? Simply ignore this email.",
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
    text: `Odyssey\n\nHi there,\n\n${paragraphs.join("\n\n")}\n\n${label}: ${url}\n\n${footer.map((l) => `${l.label}: ${l.url}`).join("\n")}`,
    html: `<!doctype html><html><body style="margin:0;background:#F8FAFC;color:#0F172A;font:16px/1.65 Arial,sans-serif"><main style="max-width:560px;margin:32px auto;padding:32px;background:white"><p style="font-weight:bold;color:#0F172A">${escape(brand.name.toUpperCase())}</p><h1 style="font-size:26px;line-height:1.3">${escape(subject)}</h1><p>Hi there,</p>${paragraphs.map((p) => `<p>${escape(p)}</p>`).join("")}<p><a href="${escape(url)}" style="display:inline-block;background:#FACC15;color:#0F172A;padding:14px 22px;border-radius:8px">${label}</a></p><p>— Odyssey</p><footer style="font-size:13px">${footer.map((l) => `<a href="${escape(l.url)}" style="color:#4338CA">${l.label}</a>`).join(" · ")}</footer></main></body></html>`,
  };
}
