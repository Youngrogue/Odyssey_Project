"use client";
import { useState } from "react";
export default function ShareLink({
  url,
  code,
}: {
  url: string;
  code: string;
}) {
  const [status, setStatus] = useState("");
  return (
    <div className="invite-link">
      <label htmlFor="public-invite-link">Your public invite link</label>
      <input
        id="public-invite-link"
        value={url}
        readOnly
        onFocus={(event) => event.target.select()}
      />
      <p>
        Your code: <strong>{code}</strong>
      </p>
      <div className="invite-actions">
        <button
          type="button"
          className="button button-primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setStatus(
                "Invite link copied. Send it to someone you'd like to bring along.",
              );
            } catch {
              setStatus("Select the link above and copy it manually.");
            }
          }}
        >
          Copy invite link
        </button>
        <a
          className="button"
          href={`mailto:?subject=${encodeURIComponent("Come find your next side quest")}&body=${encodeURIComponent(`I'm joining Odyssey — new experiences, communities and Bucket lists. Come along: ${url}`)}`}
        >
          Invite by email
        </a>
      </div>
      <p role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
