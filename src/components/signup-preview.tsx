"use client";
import { useRef, useState } from "react";
import { Icon } from "./icons";
export function SignupPreview({
  confirmationHtml,
  welcomeHtml,
}: {
  confirmationHtml: string;
  welcomeHtml: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<"start" | "confirm" | "welcome">("start");
  const [city, setCity] = useState("lagos");
  function next(value: typeof step) {
    setStep(value);
    requestAnimationFrame(() => heading.current?.focus());
  }
  return (
    <div className="signup-preview-invitation">
      <button
        type="button"
        className="text-link"
        onClick={() => {
          setStep("start");
          dialog.current?.showModal();
        }}
      >
        Try the waitlist preview <Icon name="arrow" />
      </button>
      <span>Sample email only. Nothing sent.</span>
      <dialog
        ref={dialog}
        className="signup-demo-dialog"
        aria-labelledby="signup-demo-title"
      >
        <button
          type="button"
          className="dialog-close"
          onClick={() => dialog.current?.close()}
          aria-label="Close signup preview"
        >
          ×
        </button>
        <div className="signup-demo-heading">
          <p className="eyebrow">LOCAL DEMO · NO EMAILS SENT</p>
          <h2 id="signup-demo-title" ref={heading} tabIndex={-1}>
            {step === "start"
              ? "A welcome worth opening."
              : step === "confirm"
                ? "First, make it yours."
                : "You know what comes next."}
          </h2>
          <p>
            {step === "start"
              ? "See what joining will feel like. We’ll use a sample address, so you don’t need to share yours."
              : step === "confirm"
                ? "The real flow will ask you to confirm ownership before adding you to the update list."
                : "A useful welcome, a few ideas, and clear expectations. No app account or public profile is created."}
          </p>
        </div>
        {step === "start" ? (
          <div className="signup-demo-start">
            <label className="field-label" htmlFor="demo-email">
              Sample email address
            </label>
            <input id="demo-email" readOnly value="reader@example.com" />
            <label className="field-label" htmlFor="demo-city">
              City interest <span>(optional preview)</span>
            </label>
            <select
              id="demo-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="lagos">Lagos</option>
              <option value="abuja">Abuja</option>
              <option value="ibadan">Ibadan</option>
              <option value="port-harcourt">Port Harcourt</option>
              <option value="anywhere">Prefer not to say</option>
            </select>
            <button
              type="button"
              className="button button-yellow"
              onClick={() => next("confirm")}
            >
              Preview confirmation email <Icon name="mail" />
            </button>
          </div>
        ) : (
          <>
            <div className="demo-email-envelope">
              <div>
                <span>To: reader@example.com</span>
                <strong>
                  {step === "confirm"
                    ? "Confirm your email"
                    : "You’re on the list. Here’s what comes next."}
                </strong>
              </div>
              <iframe
                title={
                  step === "confirm"
                    ? "Confirmation email preview"
                    : "Welcome email preview"
                }
                srcDoc={step === "confirm" ? confirmationHtml : welcomeHtml}
                sandbox=""
              />
            </div>
            <div className="signup-demo-actions">
              {step === "confirm" ? (
                <button
                  type="button"
                  className="button button-yellow"
                  onClick={() => next("welcome")}
                >
                  Simulate confirming my email <Icon name="check" />
                </button>
              ) : (
                <button
                  type="button"
                  className="button button-yellow"
                  onClick={() => {
                    dialog.current?.close();
                    document.getElementById("try-something")?.scrollIntoView();
                  }}
                >
                  Explore a few ideas <Icon name="arrow" />
                </button>
              )}
              <button
                type="button"
                className="text-link"
                onClick={() => next("start")}
              >
                Start again
              </button>
            </div>
            <p className="demo-footnote">
              Preview only. Links inside the sample email are inactive; use the
              buttons above to continue.
            </p>
          </>
        )}
      </dialog>
    </div>
  );
}
