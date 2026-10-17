"use client";

import { useState } from "react";
import { ideas } from "@/lib/preview/ideas";
import { rewardPreviews, trophyRanks } from "@/lib/preview/rewards";
import { Icon } from "./icons";
import { ExplorerPortrait } from "./explorer-portrait";
import { AchievementArt } from "./achievement-art";

const foodTitles = [
  "Lagos Foodie Empress",
  "Foodie Overlord",
  "Foodie Baroness",
];
const titlesFor = (id: string) => {
  if (["cuisine", "ramen", "bake"].includes(id)) return foodTitles;
  if (["salsa", "konpa", "karaoke"].includes(id))
    return ["Rhythm Royalty", "Dance-floor Favourite", "Groove Seeker"];
  if (["games", "chess"].includes(id))
    return ["Strategy Star", "Puzzle Pathfinder", "Game-night Royalty"];
  if (["paint", "pottery", "photostory"].includes(id))
    return ["Creative Trailblazer", "Maker of Moments", "Imagination Station"];
  return ["Everyday Adventurer", "Curiosity Collector", "Queen of New Things"];
};

export function RewardsPreview({
  activeIdeaId,
  onIdeaChange,
}: {
  activeIdeaId: string;
  onIdeaChange: (id: string) => void;
}) {
  const [period, setPeriod] = useState("month");
  const [view, setView] = useState("board");
  const activity = rewardPreviews[activeIdeaId];
  const titles = titlesFor(activeIdeaId);
  const scores =
    period === "month" ? [2543, 2218, 1864] : [18543, 16218, 13864];
  return (
    <section
      id="your-progress"
      className="rewards-section shell section-space"
      aria-labelledby="rewards-title"
    >
      <div className="section-heading">
        <p className="eyebrow">YOUR INTERESTS. YOUR KIND OF BRAGGING RIGHTS.</p>
        <div className="heading-row">
          <h2 id="rewards-title" tabIndex={-1}>
            Find your thing.
            <br />
            <span className="serif-note">Make a name for it.</span>
          </h2>
          <p>
            Foodie royalty. Dance-floor legend. Quiet chess obsessive. On
            Odyssey, the things you love will become a story worth showing off.
          </p>
        </div>
      </div>
      <div className="rewards-controls">
        <div>
          <label htmlFor="reward-activity">Pick your next obsession</label>
          <select
            id="reward-activity"
            value={activeIdeaId}
            onChange={(event) => onIdeaChange(event.target.value)}
          >
            {ideas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                {rewardPreviews[idea.id].label}
              </option>
            ))}
          </select>
        </div>
        <p className="rewards-invitation">
          <Icon name="spark" /> Every interest gets its moment.
        </p>
      </div>
      <div className="rewards-grid">
        <article
          className="trophy-preview"
          aria-labelledby="trophy-preview-title"
        >
          <div className="reward-card-heading">
            <span className="eyebrow">
              COLLECT EXPERIENCES. EARN YOUR STRIPES.
            </span>
            <span className="trophy-edition">F → S</span>
          </div>
          <div className="trophy-spotlight">
            <AchievementArt />
            <div>
              <span className="eyebrow">YOUR TROPHY JOURNEY</span>
              <h3 id="trophy-preview-title">{activity.family}</h3>
            </div>
          </div>
          <p className="reward-description">{activity.detail}</p>
          <div
            className="rank-ladder"
            role="img"
            aria-label="Trophy ranks: F, Getting started, then E, D, C, B, A, and S, Ultimate"
          >
            {trophyRanks.map((rank) => (
              <span
                key={rank}
                className={
                  activity.foodie && rank === "C" ? "rank-current" : ""
                }
              >
                {rank}
              </span>
            ))}
          </div>
          {activity.foodie ? (
            <div className="foodie-example">
              <strong>
                International Foodie <span>Rank C</span>
              </strong>
              <p>
                <b>7</b> countries tasted{" "}
                <span className="foodie-next">8 more to Super Foodie</span>
              </p>
              <progress
                value={7}
                max={15}
                aria-label="Foodie progress: 7 of 15 countries toward rank B"
              />
              <details className="reward-criteria">
                <summary>Your passport to the next rank</summary>
                <p>
                  Try food from any 5 countries for International Foodie, 15 for
                  Super Foodie and 35 for Platinum Foodie. Ultimate means
                  completing the whole passport edition. Cook at home, order in
                  or find a restaurant. There’s no prescribed first-five list.
                </p>
              </details>
            </div>
          ) : (
            <div className="family-example">
              <span className="rank-starter" aria-hidden="true">
                F
              </span>
              <div>
                <strong>Great stories start somewhere.</strong>
                <p>
                  Getting started is a rank of its own. Keep trying, learning
                  and making memories; each trophy has its own path to Ultimate.
                </p>
              </div>
            </div>
          )}
          <p className="reward-footnote">
            A new interest. A different rank. Build a trophy shelf that feels
            like you.
          </p>
        </article>
        <article
          className="leaderboard-preview"
          aria-labelledby="leaderboard-preview-title"
        >
          <div className="reward-card-heading">
            <span className="eyebrow">A LITTLE FRIENDLY COMPETITION</span>
            <Icon name="spark" />
          </div>
          <h3 id="leaderboard-preview-title">{activity.label}</h3>
          <p className="reward-description">
            Find your people. Chase your next personal best. There’s room for a
            little friendly rivalry, too.
          </p>
          <div
            className="competition-views"
            role="group"
            aria-label="Ways to enjoy your progress"
          >
            <button
              type="button"
              aria-pressed={view === "board"}
              onClick={() => setView("board")}
            >
              The leaderboard
            </button>
            <button
              type="button"
              aria-pressed={view === "solo"}
              onClick={() => setView("solo")}
            >
              My own pace
            </button>
          </div>
          {view === "board" ? (
            <>
              <div
                className="board-periods"
                role="group"
                aria-label="Leaderboard period"
              >
                <button
                  type="button"
                  aria-pressed={period === "month"}
                  onClick={() => setPeriod("month")}
                >
                  This month
                </button>
                <button
                  type="button"
                  aria-pressed={period === "all"}
                  onClick={() => setPeriod("all")}
                >
                  All time
                </button>
                <span>XP</span>
              </div>
              <ol
                className="sample-standings"
                aria-label={`Illustrated ${activity.label} leaderboard`}
              >
                {["Mira", "Tobi", "Dee"].map((name, index) => (
                  <li
                    key={name}
                    className={index === 0 ? "standing-winner" : ""}
                  >
                    <span
                      className="standing-position"
                      aria-label={`Position ${index + 1}`}
                    >
                      {index + 1}
                    </span>
                    <span className="standing-portrait">
                      <ExplorerPortrait person={index as 0 | 1 | 2} />
                      <span className="portrait-rank">
                        {["A", "B", "C"][index]}
                      </span>
                    </span>
                    <span className="sample-name">
                      {name}
                      <small>
                        <AchievementArt compact place={index} />
                        <span>{titles[index]}</span>
                      </small>
                    </span>
                    <strong className="standing-score">
                      {scores[index].toLocaleString("en-US")}
                      <small>XP</small>
                    </strong>
                  </li>
                ))}
              </ol>
              <div className="your-next-chapter">
                <span className="future-avatar">
                  <Icon name="plus" />
                </span>
                <p>Your name. Your next chapter.</p>
                <a href="#waitlist" aria-label="Join the waitlist for Odyssey">
                  <Icon name="arrow" />
                </a>
              </div>
            </>
          ) : (
            <div className="private-board-state">
              <AchievementArt />
              <h4>Your pace is enough.</h4>
              <p>
                You can grow your trophy collection without joining a public
                leaderboard. A quiet win is still a win.
              </p>
              <a className="text-link" href="#your-bucket-list">
                Start with something you love <Icon name="arrow" />
              </a>
            </div>
          )}
          <p className="reward-footnote">
            Competition is always optional. Personal quests build your own
            progress; public boards use Odyssey’s activity XP.
          </p>
        </article>
      </div>
      <div className="level-explainer">
        <span className="level-seal" aria-hidden="true">
          XP
        </span>
        <div>
          <h3>Keep finding new sides of yourself.</h3>
          <p>
            Start at level 1. Reach level 2 with 10 XP. Keep going from there —
            account levels have no ceiling, and every next level gives you
            something more to aim for.
          </p>
        </div>
        <a className="text-link" href="#waitlist">
          Be here for the beginning <Icon name="arrow" />
        </a>
      </div>
    </section>
  );
}
