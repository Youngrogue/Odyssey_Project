import { brand } from "../brand";
export type EmailKind = "confirmation" | "welcome";
export type EmailInput = {
  origin: string;
  token?: string;
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
function content(kind: EmailKind, input: EmailInput) {
  if (kind === "confirmation") {
    if (!input.token) throw new Error("Confirmation token required");
    return {
      subject: "Confirm your place on the Odyssey waitlist",
      paragraphs: [
        "Your next adventure starts with a little curiosity.",
        "Odyssey will help you discover activities, find your people and turn things you've always wanted to try into side quests.",
        "Confirm your email below to join the waitlist. You'll be among the first to hear when Odyssey launches.",
        "This link expires in 24 hours. Didn't request this? Simply ignore this email.",
      ],
      links: [
        {
          label: "Confirm my email",
          url: `${input.origin}/waitlist/confirm?token=${encodeURIComponent(input.token)}`,
        },
      ],
    };
  }
  return {
    subject: "Welcome to Odyssey: you're on the list",
    paragraphs: [
      "Thanks for joining the Odyssey waitlist.",
      "Same route. Same screen. Same weekend. It's easy to fall into a loop, even when there's so much to do around you and at home.",
      "Odyssey is a new way to break it. Tell it what you love, from food and music to dancing, games and the outdoors, and discover side quests that fit you, in Lagos, Abuja, Ibadan, Port Harcourt or right at home. Save ideas to your Bucket list, find people to do them with and turn \"one day\" into \"done and dusted\".",
      "We're building it now, and you'll be among the first to know when Odyssey launches.",
      "Until then, help us decide what to build first: it takes about 3 minutes.",
    ],
    links: [
      { label: "Tell us what you love", url: `${brand.surveyUrl}?source=welcome` },
      { label: "Explore ideas", url: `${brand.website}/#activity-ideas` },
      { label: "Questions answered", url: `${brand.website}/#questions` },
    ],
  };
}
export function renderWaitlistEmail(kind: EmailKind, input: EmailInput) {
  const { subject, paragraphs, links } = content(kind, input);
  const [primary, ...secondary] = links;
  const footer = [
    { label: "odyssey.soralives.xyz", url: brand.website },
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
    text: `Odyssey\n\nHi there,\n\n${paragraphs.join("\n\n")}\n\n${links.map((l) => `${l.label}: ${l.url}`).join("\n")}\n\n${footer.map((l) => `${l.label}: ${l.url}`).join("\n")}`,
    html: `<!doctype html><html><body style="margin:0;background:#F8FAFC;color:#0F172A;font:16px/1.65 Arial,sans-serif"><main style="max-width:560px;margin:32px auto;padding:32px;background:white"><a href="${escape(brand.website)}" style="text-decoration:none;color:#0F172A"><img src="${escape(brand.website)}/brand/open-loop-ink.png" alt="Odyssey logo" width="56" height="56" style="display:block;width:56px;height:56px;border:0;margin-bottom:12px"><span style="font-weight:bold;color:#0F172A">${escape(brand.name.toUpperCase())}</span></a><h1 style="font-size:26px;line-height:1.3">${escape(subject)}</h1><p>Hi there,</p>${paragraphs.map((p) => `<p>${escape(p)}</p>`).join("")}<p><a href="${escape(primary.url)}" style="display:inline-block;background:#FACC15;color:#0F172A;padding:14px 22px;border-radius:8px">${escape(primary.label)}</a></p>${secondary.length ? `<p>${secondary.map((l) => `<a href="${escape(l.url)}" style="color:#4338CA">${escape(l.label)}</a>`).join(" · ")}</p>` : ""}<p>— Odyssey</p><footer style="font-size:13px">${footer.map((l) => `<a href="${escape(l.url)}" style="color:#4338CA">${l.label}</a>`).join(" · ")}</footer></main></body></html>`,
  };
}
