"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "./icons";
export function PartnerInvitation({ contact }: { contact: string | null }) {
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setDraft(
      `Hello Odyssey project,\n\nI’d like to explore a collaboration.\n\nName: ${String(data.get("name")).trim()}\nOrganisation / community: ${String(data.get("organisation")).trim()}\nPublic link: ${String(data.get("link")).trim() || "Not supplied"}\nInterested in: ${data.get("kind")}\n\n${String(data.get("idea")).trim()}\n\nPlease reply to this email to continue the conversation.`,
    );
    setCopied(false);
    setCopyFailed(false);
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([draft], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "odyssey-partner-enquiry.txt";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section
      id="community-partners"
      className="partner-section"
      aria-labelledby="partner-title"
    >
      <div className="shell partner-layout section-space">
        <div>
          <p className="eyebrow">FOR COMMUNITIES, VENUES & BRANDS</p>
          <h2 id="partner-title">
            You bring the
            <br />
            good moments.
            <br />
            <span>Let’s connect them.</span>
          </h2>
          <p>
            Run a games night? Teach something brilliant? Have a space where
            people come together? Help more people discover what you do.
          </p>
          <ul className="partner-possibilities">
            <li>
              <Icon name="people" />
              Community events and shared interests
            </li>
            <li>
              <Icon name="compass" />
              Curated ideas and experiences
            </li>
            <li>
              <Icon name="spark" />
              Thoughtful, clearly labelled collaborations
            </li>
          </ul>
          <p className="partner-honesty">
            We’re inviting conversations. No partner relationships are being
            announced here.
          </p>
        </div>
        <div className="partner-intake">
          <h3>Start with an idea.</h3>
          <p>Prepare a short introduction. You choose when to send it.</p>
          <form onSubmit={prepare}>
            <label htmlFor="partner-name">Your name</label>
            <input
              id="partner-name"
              name="name"
              autoComplete="name"
              required
              maxLength={80}
              placeholder="What should we call you?"
            />
            <label htmlFor="partner-organisation">
              Community, venue or brand
            </label>
            <input
              id="partner-organisation"
              name="organisation"
              autoComplete="organization"
              required
              maxLength={100}
              placeholder="Who do you represent?"
            />
            <label htmlFor="partner-link">
              Website or social profile <span>(optional)</span>
            </label>
            <input
              id="partner-link"
              name="link"
              type="url"
              maxLength={300}
              placeholder="https://…"
            />
            <label htmlFor="partner-kind">
              What would you like to explore?
            </label>
            <select id="partner-kind" name="kind">
              <option>Bring our community to Odyssey</option>
              <option>List our venue or activities</option>
              <option>Create a shared collection or event</option>
              <option>Discuss a brand collaboration</option>
            </select>
            <label htmlFor="partner-idea">A little about your idea</label>
            <textarea
              id="partner-idea"
              name="idea"
              rows={3}
              maxLength={1200}
              required
              placeholder="Tell us what you have in mind…"
            />
            <button className="button button-yellow" type="submit">
              Prepare my introduction <Icon name="arrow" />
            </button>
          </form>
          <p className="partner-local-note">
            This draft is prepared on your device. It isn’t submitted or stored
            by Odyssey.
          </p>
          {draft && (
            <div
              className="partner-draft"
              role="region"
              aria-label="Your partnership introduction"
            >
              <h4>Your introduction is ready.</h4>
              <textarea
                readOnly
                aria-label="Prepared partnership introduction"
                value={draft}
                rows={7}
              />
              <div className="partner-draft-actions">
                {contact && (
                  <a
                    className="button button-yellow"
                    href={`mailto:${contact}?subject=${encodeURIComponent("A collaboration idea for Odyssey project")}&body=${encodeURIComponent(draft)}`}
                  >
                    Open email draft <Icon name="mail" />
                  </a>
                )}
                <button type="button" onClick={download}>
                  Download draft
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(draft);
                      setCopied(true);
                      setCopyFailed(false);
                    } catch {
                      setCopied(false);
                      setCopyFailed(true);
                    }
                  }}
                >
                  {copied ? "Copied" : "Copy text"}
                </button>
              </div>
              <p role="status">
                {copyFailed
                  ? "Copy wasn’t available. Select the text above or download your draft."
                  : contact
                    ? "Your email app will open. Review it before sending."
                    : "The project’s partnership inbox isn’t connected yet. Keep this draft for when enquiries open."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
