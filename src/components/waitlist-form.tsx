"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
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

export function WaitlistForm() {
  const [availability, setAvailability] = useState<
    "loading" | "open" | "closed" | "error"
  >("loading");
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [referralCode, setReferralCode] = useState<string>();
  const enabled = availability === "open";
  const id = useId();
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const inviteRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"email" | "preferences" | "done">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [city, setCity] = useState("prefer-not-to-say");
  const [chosen, setChosen] = useState<string[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refs = params.getAll("ref");
    const code =
      refs.length === 1 && /^[A-Za-z0-9_-]{16}$/.test(refs[0])
        ? refs[0]
        : undefined;
    setReferralCode(code);
    if (code) setInviteCode(code);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setAvailability("loading");
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch("/api/waitlist/status", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("status");
        const body = await response.json();
        if (typeof body.enabled !== "boolean") throw new Error("status");
        if (current) setAvailability(body.enabled ? "open" : "closed");
      })
      .catch(() => {
        if (current) setAvailability("error");
      })
      .finally(() => clearTimeout(timer));
    return () => {
      current = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [availabilityAttempt]);

  useEffect(() => () => activeRequest.current?.abort(), []);

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
    if (inviteCode.trim() && !/^[A-Za-z0-9_-]{16}$/.test(inviteCode.trim())) {
      setError(
        "Check your invite code — it should have 16 letters, numbers, dashes or underscores. You can also leave it blank.",
      );
      inviteRef.current?.focus();
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
          ...(inviteCode.trim() ? { referralCode: inviteCode.trim() } : {}),
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
          updates, plus your own invite link to share. Delivery may take a few
          minutes.
        </p>
        <a className="text-link" href="#activity-ideas">
          Browse ideas for my list <Icon name="arrow" />
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
      <details
        className="invite-code-entry"
        open={referralCode ? true : undefined}
      >
        <summary>
          {referralCode ? "You’ve been invited" : "Have an invite code?"}
        </summary>
        <label htmlFor={`${id}-invite`}>
          Invite code <span>(optional)</span>
        </label>
        <input
          ref={inviteRef}
          id={`${id}-invite`}
          name="referralCode"
          type="text"
          maxLength={16}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={inviteCode}
          onChange={(event) => {
            setInviteCode(event.target.value);
            setError("");
          }}
          disabled={!enabled || busy}
          aria-describedby={`${id}-invite-note ${id}-error`}
        />
        <p id={`${id}-invite-note`}>
          Use a friend’s code or leave this blank. Your email stays private.
        </p>
      </details>
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
      <p id={`${id}-notice`} className="form-note" aria-live="polite">
        {enabled ? (
          <>
            We’ll email a confirmation, welcome, project updates and launch
            news. Unsubscribe any time. <a href="/privacy">Privacy notice</a>.
          </>
        ) : (
          <>
            <span className="preview-dot" />{" "}
            {availability === "loading"
              ? "Checking signup availability…"
              : availability === "error"
                ? "We couldn’t check signups. Please try again."
                : "Signups are opening soon."}{" "}
            <a href="/privacy">About your privacy</a>.
          </>
        )}
      </p>
      {availability === "error" && (
        <button
          className="text-link"
          type="button"
          onClick={() => setAvailabilityAttempt((attempt) => attempt + 1)}
        >
          Try again <Icon name="arrow" />
        </button>
      )}
      <noscript>
        <p>
          Enable JavaScript to join the waitlist. You can still explore the
          ideas and read our privacy notice.
        </p>
      </noscript>
    </form>
  );
}
