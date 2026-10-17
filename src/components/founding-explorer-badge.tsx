"use client";

import { useRef, useState } from "react";

export function FoundingExplorerBadge() {
  const art = useRef<SVGSVGElement>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  async function download() {
    if (!art.current || saving) return;
    setSaving(true);
    setStatus("");
    let source: string | undefined;
    let output: string | undefined;
    try {
      source = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(art.current)], {
          type: "image/svg+xml;charset=utf-8",
        }),
      );
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1260;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("Image unavailable")),
          "image/png",
        ),
      );
      output = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = output;
      link.download = "odyssey-founding-explorer.png";
      link.click();
      setStatus("Your badge is ready to keep. Share it whenever you like.");
    } catch {
      setStatus(
        "We couldn’t save the image just now. Your recognition is still here; try again in your browser.",
      );
    } finally {
      if (source) URL.revokeObjectURL(source);
      if (output) setTimeout(() => URL.revokeObjectURL(output!), 1000);
      setSaving(false);
    }
  }
  return (
    <section className="founder-recognition" aria-labelledby="founder-title">
      <svg
        ref={art}
        xmlns="http://www.w3.org/2000/svg"
        width="600"
        height="700"
        viewBox="0 0 600 700"
        role="img"
        aria-label="Odyssey Founding Explorer. Here from the beginning. Early community, endless curiosity."
      >
        <rect width="600" height="700" rx="30" fill="#111827" />
        <rect
          x="22"
          y="22"
          width="556"
          height="656"
          rx="18"
          fill="none"
          stroke="#4b5060"
        />
        <g fill="#facc15">
          <circle cx="60" cy="67" r="14" />
          <path d="M46 67h28v5H46z" fill="#111827" />
        </g>
        <text
          x="87"
          y="77"
          fill="white"
          fontFamily="Arial,sans-serif"
          fontSize="26"
          fontWeight="700"
        >
          Odyssey
        </text>
        <path
          d="M234 289l-37 110 58-22 37 38 25-115M301 302l47 113 26-43 47 20-43-115"
          fill="#8374d9"
        />
        <path
          d="M301 136l30 13 32 2 18 28 28 17 2 34 15 29-14 29-3 34-29 18-17 27-33 2-29 15-29-15-33-2-18-28-28-17-2-33-15-30 15-29 2-34 28-17 18-28 32-2z"
          fill="#edbd37"
          stroke="#ffeba0"
          strokeWidth="4"
        />
        <circle
          cx="300"
          cy="258"
          r="87"
          fill="#b38021"
          stroke="#ffeba0"
          strokeWidth="3"
        />
        <path
          d="M262 208h76l-5 54q-5 31-25 36v18h25v16h-66v-16h25v-18q-24-8-27-36z"
          fill="#ffeeb1"
        />
        <path
          d="M264 223h-21q-6 38 28 43m66-43h20q5 38-30 43"
          fill="none"
          stroke="#ffeeb1"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <path
          d="M300 224l7 16 18 2-13 12 3 18-15-9-15 9 3-18-13-12 18-2z"
          fill="#cc942b"
        />
        <g fill="#facc15">
          <path d="M133 192l5 14 14 5-14 5-5 14-5-14-14-5 14-5zM461 325l4 11 11 4-11 4-4 11-4-11-11-4 11-4z" />
        </g>
        <text
          x="300"
          y="480"
          textAnchor="middle"
          fill="#facc15"
          fontFamily="Arial,sans-serif"
          fontSize="18"
          letterSpacing="3"
        >
          HERE FROM THE BEGINNING
        </text>
        <text
          x="300"
          y="540"
          textAnchor="middle"
          fill="white"
          fontFamily="Arial,sans-serif"
          fontSize="44"
          fontWeight="700"
        >
          Founding Explorer
        </text>
        <text
          x="300"
          y="586"
          textAnchor="middle"
          fill="#c4bedb"
          fontFamily="Arial,sans-serif"
          fontSize="20"
        >
          Early community. Endless curiosity.
        </text>
        <text
          x="300"
          y="637"
          textAnchor="middle"
          fill="#c4bedb"
          fontFamily="Arial,sans-serif"
          fontSize="14"
        >
          A LITTLE CURIOSITY. A LOT MORE LIFE.
        </text>
      </svg>
      <h2 id="founder-title">Your Founding Explorer badge.</h2>
      <p>
        A little recognition for being here early. Save it, keep it, or share it
        with your people. This waitlist badge is separate from activity ranks
        and XP.
      </p>
      <button
        type="button"
        className="button button-primary"
        onClick={download}
        disabled={saving}
      >
        {saving ? "Preparing your badge…" : "Save my badge"}
      </button>
      <p role="status">{status}</p>
    </section>
  );
}
