"use client";

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Icon } from "./icons";

const interests = [
  ["food", "Food & flavour"],
  ["dance", "Dance & music"],
  ["games", "Games"],
  ["arts", "Arts & making"],
  ["movement", "Sports & movement"],
  ["communities", "Communities"],
  ["home", "Days at home"],
] as const;

export function WaitlistForm({ enabled }: { enabled: boolean }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"email" | "preferences" | "done">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [city, setCity] = useState("prefer-not-to-say");
  const [chosen, setChosen] = useState<string[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<AbortController | null>(null);

  function changeStage(next: "preferences" | "done") {
    setError("");
    setStage(next);
    requestAnimationFrame(() => titleRef.current?.focus());
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || busy) return;
    setError("");
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      email.trim().length > 254
    ) {
      setError("Enter a valid email address, like you@example.com.");
      emailRef.current?.focus();
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const controller = new AbortController();
    activeRequest.current = controller;
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          email: email.trim(),
          website: form.get("website") || "",
        }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setError(
          response.status === 429
            ? "A few too many attempts. Please wait a little and try again."
            : response.status === 400
              ? "Check your email address and try again."
              : "We couldn’t save your signup just now. Your email is still here — please try again.",
        );
        return;
      }
      setEmail("");
      changeStage("preferences");
    } catch {
      setError(
        "We couldn’t connect. Check your connection and try again — your email is still here.",
      );
    } finally {
      clearTimeout(timer);
      activeRequest.current = null;
      setBusy(false);
    }
  }
  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const controller = new AbortController();
    activeRequest.current = controller;
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/waitlist/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ city, interests: chosen }),
      });
      const result = await response.json();
      if (activeRequest.current !== controller) return;
      if (!response.ok || result.ok !== true) throw new Error("preferences");
      changeStage("done");
    } catch {
      if (activeRequest.current !== controller) return;
      setError(
        "We couldn’t save those details. Your signup is safe — try again or skip this step.",
      );
    } finally {
      clearTimeout(timer);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setBusy(false);
      }
    }
  }

  if (stage === "done")
    return (
      <div className="signup-success" role="status">
        <span className="success-icon">
          <Icon name="check" />
        </span>
        <h3 ref={titleRef} tabIndex={-1}>
          Here’s to your next first.
        </h3>
        <p>
          Your request is saved. If this address can join, we’ll send a
          confirmation email. Confirm it to receive your welcome and launch
          updates. Delivery may take a few minutes.
        </p>
        <a className="text-link" href="#try-something">
          Find something you’d love to try <Icon name="arrow" />
        </a>
      </div>
    );

  if (stage === "preferences")
    return (
      <form className="preferences" onSubmit={savePreferences}>
        <span className="success-eyebrow">
          <Icon name="check" /> Request saved
        </span>
        <h3 ref={titleRef} tabIndex={-1}>
          What’s your kind of fun?
        </h3>
        <p>
          Check your inbox to confirm your email. While you wait, you can add a
          couple of optional details for your new signup.
        </p>
        <label className="field-label" htmlFor={`${id}-city`}>
          Your city <span>(optional)</span>
        </label>
        <select
          id={`${id}-city`}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={busy}
        >
          <option value="prefer-not-to-say">Prefer not to say</option>
          <option value="lagos">Lagos</option>
          <option value="abuja">Abuja</option>
          <option value="ibadan">Ibadan</option>
          <option value="port-harcourt">Port Harcourt</option>
          <option value="elsewhere">Somewhere else</option>
        </select>
        <fieldset disabled={busy}>
          <legend>
            Things you’d like to try <span>(optional)</span>
          </legend>
          <div className="interest-options">
            {interests.map(([value, label]) => (
              <label key={value} className="interest-option">
                <input
                  type="checkbox"
                  value={value}
                  checked={chosen.includes(value)}
                  onChange={(e) =>
                    setChosen((current) =>
                      e.target.checked
                        ? [...current, value]
                        : current.filter((item) => item !== value),
                    )
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div id={`${id}-error`} role="alert" className="form-error">
          {error}
        </div>
        <div className="preference-actions">
          <button
            className="button button-yellow"
            disabled={busy}
            type="submit"
          >
            {busy ? "Saving…" : "Done"}
            <Icon name="check" />
          </button>
          <button
            className="skip-button"
            type="button"
            onClick={() => {
              activeRequest.current?.abort();
              activeRequest.current = null;
              setBusy(false);
              changeStage("done");
            }}
          >
            Skip for now
          </button>
        </div>
      </form>
    );

  return (
    <form
      className="waitlist-form"
      onSubmit={submit}
      noValidate
      aria-label="Join the waitlist"
    >
      <label className="field-label" htmlFor={`${id}-email`}>
        Your email address
      </label>
      <div className="email-row">
        <input
          ref={emailRef}
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          disabled={!enabled || busy}
          aria-invalid={!!error}
          aria-describedby={`${id}-notice ${id}-error`}
          required
        />
        <button
          className="button button-yellow"
          type="submit"
          disabled={!enabled || busy}
        >
          {busy ? "Joining…" : "Join the waitlist"}
          <Icon name="arrow" />
        </button>
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div id={`${id}-error`} role="alert" className="form-error">
        {error}
      </div>
      <p id={`${id}-notice`} className="form-note">
        {enabled ? (
          <>
            By joining, you request a confirmation email, a welcome, project
            updates and a launch notification. Unsubscribe any time. Read our{" "}
            <Link href="/privacy">privacy notice</Link>.
          </>
        ) : (
          <>
            <span className="preview-dot" /> Preview — signups aren’t open yet.{" "}
            <Link href="/privacy">About your privacy</Link>.
          </>
        )}
      </p>
    </form>
  );
}
