"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  groups,
  ideas,
  type Idea,
  type Group,
  type Cadence,
} from "@/lib/preview/ideas";
import {
  cadenceLabels,
  periodKey,
  readBucket,
  STORAGE_KEY,
  type BucketItem,
} from "@/lib/preview/bucket";
import { Icon } from "./icons";
import { IdeaIllustration } from "./idea-illustration";

export function DiscoveryPlayground() {
  const [group, setGroup] = useState<string>("all");
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Idea | null>(null);
  const [items, setItems] = useState<BucketItem[]>([]);
  const [storageOkay, setStorageOkay] = useState(true);
  const [message, setMessage] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customGroup, setCustomGroup] = useState<Group>("home");
  const [cadence, setCadence] = useState<Cadence>("once");
  const [filter, setFilter] = useState<Cadence | "all">("all");
  const [today, setToday] = useState(() => new Date());
  const [formError, setFormError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const latestItems = useRef<BucketItem[]>([]);
  const persistent = useRef(true);
  useEffect(() => {
    try {
      latestItems.current = readBucket(localStorage.getItem(STORAGE_KEY));
      setItems(latestItems.current);
    } catch {
      persistent.current = false;
      setStorageOkay(false);
    }
    const sync = (event: StorageEvent) => {
      if (
        !persistent.current ||
        (event.key !== STORAGE_KEY && event.key !== null)
      )
        return;
      try {
        if (event.storageArea !== localStorage) return;
        latestItems.current = readBucket(localStorage.getItem(STORAGE_KEY));
        setItems(latestItems.current);
      } catch {
        persistent.current = false;
        setStorageOkay(false);
      }
    };
    window.addEventListener("storage", sync);
    const refresh = () => setToday(new Date());
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", sync);
    };
  }, []);
  function changeItems(transform: (previous: BucketItem[]) => BucketItem[]) {
    const commit = () => {
      let previous = latestItems.current;
      if (persistent.current) {
        try {
          previous = readBucket(localStorage.getItem(STORAGE_KEY));
        } catch {
          persistent.current = false;
          setStorageOkay(false);
        }
      }
      const next = transform(previous);
      latestItems.current = next;
      setItems(next);
      if (persistent.current) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          persistent.current = false;
          setStorageOkay(false);
        }
      }
    };
    // Serialize browser-tab mutations where Web Locks are available. Always
    // read the latest stored snapshot; storage events keep other tabs in sync.
    if (navigator.locks)
      void navigator.locks.request(STORAGE_KEY, commit).catch(commit);
    else commit();
  }
  useEffect(() => {
    if (selected) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [selected]);
  const done = (item: BucketItem) =>
    item.completedPeriods.includes(periodKey(item.cadence, today));
  const completed = items.filter(done).length;
  const filtered =
    group === "all" ? ideas : ideas.filter((i) => i.group === group);
  const shown = expanded ? filtered : filtered.slice(0, 6);
  function add(idea: Idea) {
    changeItems((previous) => {
      if (previous.some((i) => i.id === idea.id)) {
        setMessage("That idea is already in your preview list.");
        return previous;
      }
      setMessage(`Added “${idea.title}” to your preview list.`);
      return [
        ...previous,
        {
          id: idea.id,
          title: idea.title,
          group: idea.group,
          cadence: "once",
          completedPeriods: [],
        },
      ];
    });
  }
  function addCustom(event: FormEvent) {
    event.preventDefault();
    const title = customTitle.trim();
    if (!title) {
      setFormError("Give your side quest a name.");
      titleInput.current?.focus();
      return;
    }
    const id = crypto.randomUUID();
    changeItems((previous) => {
      if (previous.some((i) => i.title.toLowerCase() === title.toLowerCase())) {
        setFormError(
          "That idea is already in your list. Try a different name.",
        );
        return previous;
      }
      setCustomTitle("");
      setFormError("");
      setMessage(`Added “${title}” to your preview list.`);
      return [
        ...previous,
        { id, title, group: customGroup, cadence, completedPeriods: [] },
      ];
    });
  }
  function toggle(item: BucketItem) {
    const key = periodKey(item.cadence, new Date());
    changeItems((previous) =>
      previous.map((i) => {
        if (i.id !== item.id) return i;
        const wasDone = i.completedPeriods.includes(key);
        setMessage(
          wasDone
            ? `“${i.title}” marked to try.`
            : `One more experience, just for you. “${i.title}” checked off.`,
        );
        return {
          ...i,
          completedPeriods: wasDone
            ? i.completedPeriods.filter((p) => p !== key)
            : [...i.completedPeriods, key],
        };
      }),
    );
  }
  function download() {
    const text = `MY ODYSSEY BUCKET LIST\nExported from the local landing-page preview.\n\n${items.map((i) => `${done(i) ? "[x]" : "[ ]"} ${i.title}\n    ${cadenceLabels[i.cadence]} · ${groups.find((g) => g.id === i.group)?.label}`).join("\n\n")}\n`;
    const href = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = href;
    a.download = "my-odyssey-bucket-list.txt";
    a.click();
    URL.revokeObjectURL(href);
    setMessage("Your preview list has been downloaded.");
  }
  function close() {
    dialog.current?.close();
    setSelected(null);
    opener.current?.focus();
  }
  return (
    <>
      <section
        id="try-something"
        className="discovery-section shell section-space"
        aria-labelledby="discovery-title"
      >
        <div className="section-heading">
          <p className="eyebrow">GOOD DAYS START WITH A LITTLE CURIOSITY</p>
          <div className="heading-row">
            <h2 id="discovery-title">
              Find your next
              <br />
              <span className="serif-note">“why not?”</span>
            </h2>
            <p>
              Big adventures. Little detours. Good company.
              <br />A few ideas to get your own list going.
            </p>
          </div>
        </div>
        <div
          className="idea-filters"
          role="group"
          aria-label="Filter activity ideas"
        >
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              onClick={() => {
                setGroup(g.id);
                setExpanded(false);
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="idea-grid">
          {shown.map((idea) => {
            const saved = items.some((i) => i.id === idea.id);
            return (
              <article className={`idea-card tone-${idea.tone}`} key={idea.id}>
                <button
                  className="idea-open"
                  type="button"
                  onClick={(e) => {
                    opener.current = e.currentTarget;
                    setSelected(idea);
                  }}
                  aria-label={`Explore idea: ${idea.title}`}
                >
                  <div className="idea-art">
                    <span className="setting-chip">{idea.setting}</span>
                    <IdeaIllustration symbol={idea.symbol} />
                    <span className="idea-art-arrow">
                      <Icon name="arrowUp" />
                    </span>
                  </div>
                  <div className="idea-copy">
                    <p className="eyebrow">
                      {groups.find((g) => g.id === idea.group)?.label}
                    </p>
                    <h3>{idea.title}</h3>
                    <p className="idea-description">{idea.description}</p>
                  </div>
                </button>
                <div className="idea-bottom">
                  <span>{idea.company}</span>
                  <button
                    className="save-idea"
                    type="button"
                    aria-label={`${saved ? "Saved" : "Add"}: ${idea.title}`}
                    aria-pressed={saved}
                    onClick={() => add(idea)}
                  >
                    <Icon name={saved ? "check" : "plus"} />
                    {saved ? "On your list" : "Add to list"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="discovery-foot">
          <p>
            Just a taste of what’s possible. These are activity ideas, not live
            events or bookings.
          </p>
          {filtered.length > 6 && (
            <button
              className="text-link"
              type="button"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Show fewer ideas" : "More ideas, please"}{" "}
              <Icon name={expanded ? "arrowUp" : "plus"} />
            </button>
          )}
        </div>
        <a className="bucket-jump" href="#your-bucket-list">
          <Icon name="list" /> Your preview list <span>{items.length}</span>
          <Icon name="arrow" />
        </a>
      </section>

      <section
        id="your-bucket-list"
        className="bucket-section"
        aria-labelledby="bucket-title"
      >
        <div className="shell bucket-layout section-space">
          <div className="bucket-story">
            <p className="eyebrow">FROM “ONE DAY” TO “I DID THAT”</p>
            <h2 id="bucket-title">
              A little list.
              <br />A life with
              <br />
              <span>more stories.</span>
            </h2>
            <p>
              Save something that catches your eye. Add an idea of your own.
              Make it a daily ritual, a weekly plan or a once-in-a-while
              adventure.
            </p>
            <div className="preview-explainer">
              <Icon name="spark" />
              <p>
                <strong>Try it right here.</strong> This working preview stays
                in this browser. It doesn’t create an account or award XP. You
                can download or clear it any time.
              </p>
            </div>
            <div className="future-rewards">
              <Icon name="trophy" />
              <div>
                <strong>Every interest has its own story.</strong>
                <p>
                  The app will recognise progress across activities with trophy
                  families, from Getting started to a completed Ultimate
                  edition. Food, sports, making, games — it’s about what you
                  try.
                </p>
              </div>
            </div>
          </div>
          <div className="bucket-board">
            <div className="bucket-board-header">
              <div>
                <span className="eyebrow">YOUR INTERACTIVE PREVIEW</span>
                <h3>My next little adventures</h3>
              </div>
              <span className="bucket-sticker">
                <Icon name="spark" />
              </span>
            </div>
            <div className="bucket-progress">
              <span>
                {completed} checked off · {items.length} ideas
              </span>
              <progress
                max={Math.max(1, items.length)}
                value={completed}
                aria-label="Preview list completion"
              />
            </div>
            <div
              className="bucket-tabs"
              role="group"
              aria-label="Filter your list"
            >
              {(["all", "once", "daily", "weekly", "monthly"] as const).map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={filter === c}
                    onClick={() => setFilter(c)}
                  >
                    {c === "all" ? "Everything" : cadenceLabels[c]}
                  </button>
                ),
              )}
            </div>
            {items.filter((i) => filter === "all" || i.cadence === filter)
              .length === 0 ? (
              <div className="bucket-empty">
                <Icon name="list" />
                <p>
                  {items.length
                    ? "Nothing on this part of your list yet."
                    : "What have you always wanted to try?"}
                </p>
                <span>Pick an idea above, or add your own below.</span>
              </div>
            ) : (
              <ul className="bucket-items">
                {items
                  .filter((i) => filter === "all" || i.cadence === filter)
                  .map((item) => (
                    <li
                      key={item.id}
                      className={done(item) ? "is-complete" : ""}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={done(item)}
                          onChange={() => toggle(item)}
                        />
                        <span className="bucket-item-label">
                          <span>{item.title}</span>
                          <small>
                            {cadenceLabels[item.cadence]} ·{" "}
                            {groups.find((g) => g.id === item.group)?.label}
                          </small>
                        </span>
                      </label>
                      <button
                        className="remove-item"
                        type="button"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => {
                          changeItems((old) =>
                            old.filter((i) => i.id !== item.id),
                          );
                          setMessage(`Removed “${item.title}”.`);
                        }}
                      >
                        ×
                      </button>
                    </li>
                  ))}
              </ul>
            )}
            <form className="bucket-add" onSubmit={addCustom}>
              <label htmlFor="new-quest" className="field-label">
                An idea of your own
              </label>
              <input
                ref={titleInput}
                id="new-quest"
                value={customTitle}
                maxLength={100}
                onChange={(e) => {
                  setCustomTitle(e.target.value);
                  setFormError("");
                }}
                placeholder="I’ve always wanted to…"
                aria-describedby={formError ? "bucket-form-error" : undefined}
                aria-invalid={!!formError}
              />
              <div className="bucket-select-row">
                <div>
                  <label htmlFor="quest-category">Category</label>
                  <select
                    id="quest-category"
                    value={customGroup}
                    onChange={(e) => setCustomGroup(e.target.value as Group)}
                  >
                    {groups
                      .filter((g) => g.id !== "all")
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="quest-cadence">Make time for it</label>
                  <select
                    id="quest-cadence"
                    value={cadence}
                    onChange={(e) => setCadence(e.target.value as Cadence)}
                  >
                    {Object.entries(cadenceLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="button button-yellow">
                  <Icon name="plus" />
                  Add idea
                </button>
              </div>
              <p id="bucket-form-error" className="form-error" role="alert">
                {formError}
              </p>
            </form>
            <p className="recurrence-note">
              Daily, weekly and monthly checks reset for the next period using
              your device’s date. Weeks start on Monday. Your ideas stay on the
              list.
            </p>
            <div className="bucket-actions">
              <button type="button" onClick={download} disabled={!items.length}>
                Download my list <Icon name="arrow" />
              </button>
              {!confirmClear ? (
                <button
                  type="button"
                  disabled={!items.length}
                  onClick={() => setConfirmClear(true)}
                >
                  Clear preview
                </button>
              ) : (
                <span className="clear-confirm">
                  <button
                    type="button"
                    onClick={() => {
                      changeItems(() => []);
                      setConfirmClear(false);
                      setMessage("Your preview list has been cleared.");
                    }}
                  >
                    Yes, clear it
                  </button>
                  <button type="button" onClick={() => setConfirmClear(false)}>
                    Keep it
                  </button>
                </span>
              )}
            </div>
            {!storageOkay && (
              <p role="status" className="form-error">
                Browser storage isn’t available. This list works for this visit;
                download it before leaving.
              </p>
            )}
          </div>
        </div>
      </section>
      <p className="sr-only" role="status" aria-live="polite">
        {message}
      </p>
      <dialog
        ref={dialog}
        className="idea-dialog"
        aria-labelledby="idea-dialog-title"
        onCancel={close}
        onClose={() => {
          setSelected(null);
          opener.current?.focus();
        }}
      >
        {selected && (
          <>
            <button
              type="button"
              className="dialog-close"
              aria-label="Close activity details"
              onClick={close}
            >
              ×
            </button>
            <div className={`dialog-art tone-${selected.tone}`}>
              <IdeaIllustration symbol={selected.symbol} />
            </div>
            <div className="dialog-copy">
              <p className="eyebrow">AN IDEA FOR YOUR BUCKET LIST</p>
              <h2 id="idea-dialog-title">{selected.title}</h2>
              <p>{selected.description}</p>
              <h3>Your first step</h3>
              <p>{selected.firstStep}</p>
              <div className="dialog-tags">
                <span>{selected.setting}</span>
                <span>{selected.company}</span>
              </div>
              <button
                type="button"
                className="button button-yellow"
                onClick={() => {
                  add(selected);
                  close();
                }}
              >
                {items.some((i) => i.id === selected.id)
                  ? "Already on your list"
                  : "Add to my preview list"}
                <Icon name="check" />
              </button>
              <p className="dialog-note">
                Activity preview. Current venues, prices and event dates will be
                listed as the catalogue develops.
              </p>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
