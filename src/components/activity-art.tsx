import { Icon } from "./icons";

export function ActivityArt() {
  return (
    <figure
      className="activity-art"
      aria-label="Illustration of ideas to try: salsa, a games night at home and a new direction."
    >
      <div className="art-orbit orbit-one" aria-hidden="true" />
      <div className="art-orbit orbit-two" aria-hidden="true" />
      <span className="art-caption">YOUR LIFE. MORE PLAY.</span>
      <div className="compass-disc" aria-hidden="true">
        <svg viewBox="0 0 320 320" fill="none">
          <circle
            cx="160"
            cy="160"
            r="126"
            fill="white"
            stroke="currentColor"
            strokeWidth="3"
          />
          <circle
            cx="160"
            cy="160"
            r="113"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray="1.6 17.6"
          />
          <circle
            cx="160"
            cy="160"
            r="90"
            fill="#FACC15"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="m229 91-39 89-99 49 48-98Z" fill="currentColor" />
          <path d="m219 101-58 59 21 12Z" fill="white" />
          <path d="m101 219 59-58-11-19Z" fill="#FACC15" />
          <circle
            cx="160"
            cy="160"
            r="13"
            fill="white"
            stroke="currentColor"
            strokeWidth="4"
          />
        </svg>
      </div>
      <div className="activity-ticket ticket-violet" aria-hidden="true">
        <div className="ticket-top">
          <span>A LITTLE OUT OF ROUTINE</span>
          <Icon name="arrowUp" />
        </div>
        <div className="ticket-dance">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="ticket-title">
          Two left feet.
          <br />
          One new story.
        </div>
        <div className="ticket-bottom">
          TRY A SALSA STEP <span>01 / ∞</span>
        </div>
      </div>
      <div className="activity-ticket ticket-games" aria-hidden="true">
        <div className="ticket-top">
          <span>GOOD COMPANY. YOUR PLACE.</span>
          <Icon name="spark" />
        </div>
        <div className="dice">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="ticket-title">
          Make a night
          <br />
          of staying in.
        </div>
        <div className="ticket-bottom">
          GAMES NIGHT <span>02 / ∞</span>
        </div>
      </div>
      <div className="home-stamp" aria-hidden="true">
        <Icon name="home" />
        <span>
          AT HOME
          <br />
          COUNTS, TOO.
        </span>
      </div>
      <Icon name="spark" className="art-spark spark-coral" />
      <Icon name="spark" className="art-spark spark-ink" />
      <span className="art-footnote" aria-hidden="true">
        A few ideas. Endless possibilities.
      </span>
    </figure>
  );
}
