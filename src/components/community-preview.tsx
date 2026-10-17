"use client";
import { useState } from "react";
import { Icon } from "./icons";
import { CommunityIsland } from "./community-islands";

const communities = [
  {
    title: "A dance floor. A new circle.",
    kind: "Dance & music",
    tone: "violet",
    scene: "dance" as const,
    description:
      "Salsa, Konpa, live music, house nights. Find people who love the same rhythm.",
    detail:
      "Start with a beginner class, bring a friend to a social, or make a night of discovering a new sound. You don’t need to know the steps to take the first one.",
    interests: ["Salsa & Konpa", "Dance socials", "Live music", "House & EDM"],
    quest: "Find your next activity",
  },
  {
    title: "Make room at the games table.",
    kind: "Games & hangouts",
    tone: "yellow",
    scene: "games" as const,
    description:
      "Karaoke, board games and the sort of evening that starts with “one more round.”",
    detail:
      "Find your board-game people, brave the karaoke mic, or turn a quiet catch-up into a regular thing. A friendly table is a good place to begin.",
    interests: ["Board games", "Karaoke", "Chess", "Casual hangouts"],
    quest: "Choose something fun",
  },
  {
    title: "Come for the shared interest.",
    kind: "Books & little adventures",
    tone: "coral",
    scene: "books" as const,
    description:
      "A book discussion, a picnic, a walk. Good company can begin with something simple.",
    detail:
      "Swap a recommendation, join a reading circle, or take the conversation outdoors. There’s room for the quieter kinds of adventure too.",
    interests: ["Book clubs", "Reading circles", "Picnics", "City walks"],
    quest: "Explore your interests",
  },
];

export function CommunityPreview() {
  const [open, setOpen] = useState<number | null>(0);
  const toggle = (index: number) =>
    setOpen((current) => (current === index ? null : index));
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
            <CommunityIsland
              scene={c.scene}
              active={open === i}
              label={c.kind}
              number={i + 1}
              controls={`community-paths-${i}`}
              onToggle={() => toggle(i)}
            />
            <p className="eyebrow">{c.kind}</p>
            <h3>{c.title}</h3>
            <p>{c.description}</p>
            <button
              type="button"
              className="text-link"
              aria-expanded={open === i}
              aria-controls={`community-paths-${i}`}
              onClick={() => toggle(i)}
            >
              {open === i ? "Close this circle" : "Find your people"}
              <Icon name={open === i ? "minus" : "plus"} />
            </button>
            <div
              hidden={open !== i}
              id={`community-paths-${i}`}
              className="community-leads"
            >
              <p>{c.detail}</p>
              <ul
                className="community-interests"
                aria-label={`${c.kind} interests`}
              >
                {c.interests.map((interest) => (
                  <li key={interest}>{interest}</li>
                ))}
              </ul>
              <a href="#try-something">
                {c.quest}
                <Icon name="arrow" />
              </a>
            </div>
          </article>
        ))}
      </div>
      <div className="community-bottom-line">
        <p className="community-footnote">
          Prefer your own company? Solo, home and online activities belong here
          too.
        </p>
        <a
          className="iso-glow-credit"
          href="https://iso-glow.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Made with ISO-GLOW ↗
        </a>
      </div>
    </section>
  );
}
