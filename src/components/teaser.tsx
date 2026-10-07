"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { brand } from "@/lib/brand";
export function Teaser({ film = "loop" }: { film?: "loop" | "launch" }) {
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const launch = film === "launch";
  const base = launch ? "/media/odyssey-launch" : "/media/break-the-loop";
  const title = launch ? "A little more life" : "Break the loop";
  useEffect(() => {
    if (started) {
      const video = videoRef.current;
      const disclosure = video?.closest("details");
      const pauseWhenHidden = () => {
        if (disclosure && !disclosure.open) video?.pause();
      };
      video?.focus();
      if (!disclosure || disclosure.open) video?.play().catch(() => {});
      disclosure?.addEventListener("toggle", pauseWhenHidden);
      return () => disclosure?.removeEventListener("toggle", pauseWhenHidden);
    }
  }, [started]);
  function pauseOthers() {
    document.querySelectorAll("video").forEach((video) => {
      if (video !== videoRef.current) video.pause();
    });
  }
  return (
    <div className={`teaser-player ${launch ? "portrait-player" : ""}`}>
      {started ? (
        <>
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            tabIndex={0}
            aria-label={`${title} — ${brand.name} concept film`}
            poster={`${base}-poster.jpg`}
            width={launch ? 720 : 1280}
            height={launch ? 1280 : 720}
            onPlay={pauseOthers}
            onError={() => setFailed(true)}
          >
            <source
              src={`${base}-web.mp4`}
              type="video/mp4"
              onError={() => setFailed(true)}
            />
            <track
              default
              kind="captions"
              srcLang="en"
              label="English — on-screen text"
              src={`${base}.vtt`}
            />
            Your browser cannot play this video. Read the film summary below.
          </video>
          {failed && (
            <div className="video-error" role="status">
              <p>
                The film couldn’t load. You can read its summary below or try
                again.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFailed(false);
                  videoRef.current?.load();
                  videoRef.current?.play().catch(() => {});
                }}
              >
                Retry film
              </button>
            </div>
          )}
        </>
      ) : (
        <button
          className="teaser-cover"
          type="button"
          onClick={() => setStarted(true)}
          aria-label={
            launch
              ? "Watch the 20-second Odyssey film"
              : "Watch the 40-second teaser"
          }
        >
          <img
            src={`${base}-poster.jpg`}
            width={launch ? 720 : 1280}
            height={launch ? 1280 : 720}
            alt={
              launch
                ? "Odyssey project. A little curiosity. A lot more life."
                : "Take a new turn. A yellow compass points towards something new."
            }
            loading="lazy"
          />
          <span className="play-label">
            <span className="play-circle">
              <Icon name="play" />
            </span>
            <span>
              {title}
              <span className="play-duration">
                CONCEPT FILM · {launch ? "00:20" : "00:40"}
              </span>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
