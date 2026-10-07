"use client";
import { useState } from "react";
import { Icon } from "./icons";
const communities = [
  {
    title: "A dance floor. A new circle.",
    kind: "Dance & music",
    tone: "violet",
    description:
      "Salsa, Konpa, live music, house nights. Find people who love the same rhythm.",
    leads:
      "Body Language, Inner Circle, and Free Style Friday with NW are among the community leads we’re exploring. Each has its own scene; dance classes, gospel socials and raves stay distinct.",
    quest: "Try a dance session",
  },
  {
    title: "Make room at the games table.",
    kind: "Games & hangouts",
    tone: "yellow",
    description:
      "Karaoke, board games and the sort of evening that starts with “one more round.”",
    leads:
      "TSL Mondays and Gameland Lagos are on our research list. We’ll link their activities to confirmed organisers, venues and event dates as details are checked.",
    quest: "Find a games night",
  },
  {
    title: "Come for the shared interest.",
    kind: "Books & little adventures",
    tone: "coral",
    description:
      "A book discussion, a picnic, a walk. Good company can begin with something simple.",
    leads:
      "Northstarlibrary and The Good Co. Ng are examples from our community research. Their programmes and next events will be checked before appearing in the calendar.",
    quest: "Meet through an interest",
  },
];
export function CommunityPreview() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section
      id="find-your-people"
      className="communities-section shell section-space"
      aria-labelledby="communities-title"
    >
      <div className="section-heading">
        <p className="eyebrow">YOUR PEOPLE MIGHT BE ONE SIDE QUEST AWAY</p>
        <div className="heading-row">
          <h2 id="communities-title">
            Good things.
            <br />
            Better company.
          </h2>
          <p>
            Discover communities around what you enjoy.
            <br />
            Join in when it feels right for you.
          </p>
        </div>
      </div>
      <div className="community-grid">
        {communities.map((c, i) => (
          <article key={c.title} className={`community-card tone-${c.tone}`}>
            <div className="community-faces" aria-hidden="true">
              <span>
                <svg viewBox="0 0 60 60">
                  <path
                    d="M11 36c0-18 12-24 21-22 14 1 18 14 14 24-3 10-29 14-35-2"
                    fill="currentColor"
                  />
                  <path
                    d="M22 32v3m13-3v3m-12 6q6 6 13-2"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span>
                <svg viewBox="0 0 60 60">
                  <path
                    d="m14 43-3-23 16-9 16 6 7 20-16 13Z"
                    fill="currentColor"
                  />
                  <path
                    d="M22 27v3m12-5v3m-10 9q7 5 12-3"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span>
                <Icon name="plus" />
              </span>
            </div>
            <p className="eyebrow">{c.kind}</p>
            <h3>{c.title}</h3>
            <p>{c.description}</p>
            <button
              type="button"
              className="text-link"
              aria-expanded={open === i}
              aria-controls={`community-leads-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              {open === i
                ? "Hide community examples"
                : "Explore community examples"}
              <Icon name="plus" />
            </button>
            <div
              hidden={open !== i}
              id={`community-leads-${i}`}
              className="community-leads"
            >
              <p>{c.leads}</p>
              <strong>
                Research examples, not announced partners or live events.
              </strong>
              <a href="#try-something">
                {c.quest} <Icon name="arrow" />
              </a>
            </div>
          </article>
        ))}
      </div>
      <p className="community-footnote">
        Prefer your own company? Solo, home and online activities belong here
        too.
      </p>
    </section>
  );
}
