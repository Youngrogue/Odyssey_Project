"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "./icons";
import { brand } from "@/lib/brand";

export function WaitlistForm() {
  const [availability, setAvailability] = useState<
    "loading" | "open" | "closed" | "error"
  >("loading");
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const enabled = availability === "open";
  const id = useId();
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"email" | "done">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<AbortController | null>(null);

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

  function changeStage(next: "done") {
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
      changeStage("done");
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
  if (stage === "done")
    return (
      <div className="signup-success" role="status">
        <span className="success-icon">
          <Icon name="check" />
        </span>
        <h3 ref={titleRef} tabIndex={-1}>
          You’re on the list.
        </h3>
        <p>
          We’ve sent you a welcome email. It may take a few minutes, so check
          spam or promotions too. You’ll be among the first to know when
          Odyssey launches.
        </p>
        <p>
          While you wait, tell us what you&rsquo;d love to do in our{" "}
          <a
            href={`${brand.surveyUrl}?source=signup`}
            target="_blank"
            rel="noopener noreferrer"
          >
            3-minute survey
          </a>
          .
        </p>
        <a className="text-link" href="#activity-ideas">
          Browse ideas for my list <Icon name="arrow" />
        </a>
      </div>
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
          {busy ? "Joining…" : "Notify me at launch"}
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
      <p id={`${id}-notice`} className="form-note" aria-live="polite">
        {enabled ? (
          <>
            By joining, you agree to get Odyssey emails about our launch.
            Unsubscribe anytime. <a href="/privacy">Privacy notice</a>.
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
