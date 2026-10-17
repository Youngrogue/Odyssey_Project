"use client";

import { useId, type CSSProperties } from "react";

type Scene = "dance" | "games" | "books";
type Point = [number, number, number];
const C = Math.cos(Math.PI / 6);
const S = Math.sin(Math.PI / 6);
const project = ([x, y, z]: Point) => [(x - y) * C + 198, (x + y) * S - z + 88];
const delta = ([x, y, z]: Point) => [(x - y) * C, (x + y) * S - z];
function plane(origin: Point, horizontal: Point, vertical: Point) {
  const o = project(origin),
    u = delta(horizontal),
    v = delta(vertical);
  return `matrix(${u[0]} ${u[1]} ${v[0]} ${v[1]} ${o[0]} ${o[1]})`;
}
const top = (x: number, y: number, z: number) =>
  plane([x, y, z], [1, 0, 0], [0, 1, 0]);
const front = (x: number, y: number, z: number) =>
  plane([x, y, z], [1, 0, 0], [0, 0, -1]);
const side = (x: number, y: number, z: number) =>
  plane([x, y, z], [0, -1, 0], [0, 0, -1]);

// Opaque faces, painted in depth order. All face details use the same kernel.
function Box({
  x,
  y,
  z,
  w,
  d,
  h,
  className = "",
}: {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  className?: string;
}) {
  return (
    <g className={`iso-box ${className}`}>
      <rect
        className="iso-face iso-side"
        transform={side(x + w, y + d, z + h)}
        width={d}
        height={h}
      />
      <rect
        className="iso-face"
        transform={front(x, y + d, z + h)}
        width={w}
        height={h}
      />
      <rect
        className="iso-face iso-top"
        transform={top(x, y, z + h)}
        width={w}
        height={d}
      />
    </g>
  );
}

function Person({
  x,
  y,
  pose = "standing",
}: {
  x: number;
  y: number;
  pose?: "standing" | "dancing";
}) {
  const [cx, cy] = project([x, y, 39]);
  return (
    <g className="iso-person">
      <circle cx={cx} cy={cy - 11} r="4.6" />
      <path
        d={`M${cx} ${cy - 5}v18M${cx} ${cy}${pose === "dancing" ? "l-11 -8" : "l-8 9"}M${cx} ${cy}${pose === "dancing" ? "l12 -11" : "l8 9"}M${cx} ${cy + 13}l-6 13M${cx} ${cy + 13}l7 12`}
      />
    </g>
  );
}

function DanceScene() {
  return (
    <>
      <g transform={top(40, 65, 9)}>
        <rect className="iso-live-floor" width="158" height="100" />
        {[0, 1, 2, 3].map((n) => (
          <path
            className="iso-detail"
            key={n}
            d={`M${n * 40} 0v100M0 ${n * 25}h158`}
          />
        ))}
      </g>
      <Box x={29} y={20} z={8} w={166} d={31} h={12} />
      <Box x={45} y={22} z={20} w={128} d={10} h={80} />
      <g transform={front(45, 32, 100)}>
        <rect
          className="iso-light"
          x="8"
          y="9"
          width="112"
          height="58"
          rx="2"
        />
        <text className="iso-sign" x="64" y="33" textAnchor="middle">
          GOOD
        </text>
        <text className="iso-sign" x="64" y="53" textAnchor="middle">
          TOGETHER
        </text>
      </g>
      <Box x={22} y={44} z={8} w={24} d={23} h={56} />
      <g transform={front(22, 67, 64)}>
        {[15, 39].map((y) => (
          <circle className="iso-speaker" key={y} cx="12" cy={y} r="8" />
        ))}
      </g>
      <Box x={176} y={45} z={8} w={24} d={23} h={56} />
      <g transform={front(176, 68, 64)}>
        {[15, 39].map((y) => (
          <circle className="iso-speaker" key={y} cx="12" cy={y} r="8" />
        ))}
      </g>
      <Person x={92} y={93} pose="dancing" />
      <Person x={148} y={96} pose="dancing" />
      <Person x={106} y={143} pose="dancing" />
      <g transform={front(15, 180, 8)}>
        <rect className="iso-light" x="0" y="2" width="200" height="3" />
      </g>
    </>
  );
}

function GamesScene() {
  return (
    <>
      <Box x={37} y={21} z={8} w={143} d={12} h={64} />
      <g transform={front(37, 33, 72)}>
        <rect
          className="iso-light"
          x="8"
          y="8"
          width="126"
          height="26"
          rx="2"
        />
        <text className="iso-sign" x="71" y="26" textAnchor="middle">
          ONE MORE ROUND
        </text>
        <path
          className="iso-detail"
          d="M11 46h121M23 39v19m20-19v19m20-19v19m20-19v19m20-19v19m20-19v19"
        />
      </g>
      <Box x={25} y={46} z={8} w={24} d={78} h={28} />
      <Box x={30} y={46} z={36} w={7} d={78} h={16} />
      <Box x={91} y={73} z={8} w={12} d={60} h={27} />
      <Box x={70} y={64} z={35} w={93} d={78} h={6} />
      <g transform={top(77, 70, 42)}>
        <rect className="iso-light" width="79" height="66" rx="3" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            {[0, 1, 2, 3].map(
              (j) =>
                (i + j) % 2 === 0 && (
                  <rect
                    className="iso-game-square"
                    key={j}
                    x={8 + i * 12}
                    y={9 + j * 12}
                    width="12"
                    height="12"
                  />
                ),
            )}
          </g>
        ))}
      </g>
      <Box x={94} y={89} z={42} w={11} d={11} h={11} />
      <g transform={top(94, 89, 53)}>
        <circle className="iso-dot" cx="4" cy="4" r="1.4" />
        <circle className="iso-dot" cx="8" cy="8" r="1.4" />
      </g>
      <Box x={124} y={112} z={42} w={11} d={11} h={11} />
      <Box x={171} y={74} z={8} w={24} d={70} h={28} />
      <Box x={188} y={74} z={36} w={7} d={70} h={16} />
      <Box x={82} y={159} z={8} w={66} d={17} h={18} />
      <g transform={front(82, 176, 26)}>
        <rect className="iso-light" x="7" y="6" width="52" height="3" />
      </g>
    </>
  );
}

function BooksScene() {
  return (
    <>
      <Box x={31} y={23} z={8} w={101} d={18} h={80} />
      <g transform={front(31, 41, 88)}>
        <rect className="iso-recess" x="7" y="7" width="87" height="63" />
        {[0, 1].map((row) => (
          <g key={row}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect
                className={i % 3 === 0 ? "iso-light" : "iso-book"}
                key={i}
                x={12 + i * 10}
                y={12 + row * 31 + (i % 2) * 4}
                width="7"
                height={21 - (i % 2) * 4}
              />
            ))}
            <path className="iso-detail" d={`M7 ${36 + row * 31}h87`} />
          </g>
        ))}
      </g>
      <Box x={168} y={35} z={8} w={30} d={32} h={22} />
      <Box x={180} y={46} z={30} w={5} d={5} h={37} />
      <g transform={front(159, 60, 111)}>
        <path
          className="iso-tree"
          d="M24 0c-14 0-19 14-15 23-16 12-8 30 3 33h27c16-9 14-25 6-30C52 13 40 0 24 0Z"
        />
        <path className="iso-detail" d="M24 14v46m0-23L14 27m10 19 13-16" />
      </g>
      <Box x={48} y={78} z={8} w={78} d={25} h={24} />
      <Box x={49} y={78} z={32} w={76} d={6} h={23} />
      <g transform={top(59, 88, 33)}>
        <rect className="iso-light" width="18" height="15" />
        <path className="iso-detail" d="M9 0v15" />
      </g>
      <Box x={137} y={109} z={8} w={32} d={30} h={29} />
      <Box x={134} y={106} z={37} w={39} d={35} h={4} />
      <g transform={top(142, 113, 42)}>
        <rect className="iso-light" width="22" height="20" />
        <path className="iso-detail" d="M11 0v20" />
      </g>
      <g transform={top(36, 130, 9)}>
        <path className="iso-garden-path" d="M0 21h76l21 20h68" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path className="iso-detail" key={i} d={`M${i * 13} 14v14`} />
        ))}
      </g>
      <Person x={92} y={130} />
    </>
  );
}

const sceneNames: Record<Scene, string> = {
  dance: "a dance stage and an illuminated dance floor",
  games: "a games lounge with a glowing board-game table",
  books: "a reading garden with a bookcase, open books and a tree",
};

export function CommunityIsland({
  scene,
  active,
  label,
  number,
  controls,
  onToggle,
}: {
  scene: Scene;
  active: boolean;
  label: string;
  number: number;
  controls: string;
  onToggle: () => void;
}) {
  const glowId = `community-glow-${useId().replace(/:/g, "")}`;
  return (
    <button
      className={`community-island island-${scene}`}
      type="button"
      aria-expanded={active}
      aria-controls={controls}
      aria-label={`${active ? "Close" : "Explore"} ${label.toLowerCase()} communities`}
      onClick={onToggle}
    >
      <span className="island-plate-label">
        <span>FIG 0{number}</span>
        <span className="island-power-dot" aria-hidden="true" />
      </span>
      <svg
        viewBox="0 0 420 315"
        role="img"
        aria-label={`Isometric ${sceneNames[scene]}. Select to light the scene and explore ${label.toLowerCase()}.`}
      >
        <defs>
          <filter
            id={glowId}
            x="-100"
            y="-100"
            width="620"
            height="520"
            filterUnits="userSpaceOnUse"
          >
            <feGaussianBlur stdDeviation="3.2" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g
          className="island-scene"
          style={{ "--island-glow": `url(#${glowId})` } as CSSProperties}
        >
          <Box x={0} y={0} z={0} w={228} d={180} h={8} />
          <g transform={top(8, 8, 9)}>
            <rect className="iso-detail" width="212" height="164" rx="2" />
            {[
              [5, 5],
              [206, 5],
              [5, 159],
              [206, 159],
            ].map(([x, y]) => (
              <circle
                className="iso-screw"
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                r="1.8"
              />
            ))}
          </g>
          {scene === "dance" ? (
            <DanceScene />
          ) : scene === "games" ? (
            <GamesScene />
          ) : (
            <BooksScene />
          )}
        </g>
      </svg>
      <span className="island-readout">
        <span>{active ? "your next circle" : "find your people"}</span>
        <span aria-hidden="true">{active ? "−" : "+"}</span>
      </span>
    </button>
  );
}
