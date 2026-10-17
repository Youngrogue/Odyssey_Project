import { useId } from "react";

// Original illustrated characters, not photographs or customer endorsements.
export function ExplorerPortrait({ person }: { person: 0 | 1 | 2 }) {
  const id = useId().replaceAll(":", "");
  const skin = ["#995332", "#733e2b", "#b96e46"][person];
  const light = ["#c58052", "#a9643d", "#dc9a6a"][person];
  const background = ["#e2d8ff", "#f9dd76", "#f6c9c4"][person];
  return (
    <svg
      viewBox="0 0 120 120"
      className="explorer-portrait"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`${id}-circle`}>
          <circle cx="60" cy="60" r="59" />
        </clipPath>
        <linearGradient id={`${id}-skin`} x1="0" x2="1" y1="0" y2=".8">
          <stop stopColor={light} />
          <stop offset="1" stopColor={skin} />
        </linearGradient>
        <linearGradient id={`${id}-shirt`} x1="0" y1="0" x2=".8" y2="1">
          <stop
            stopColor={
              person === 1 ? "#f3ede2" : person === 2 ? "#a52653" : "#6650bb"
            }
          />
          <stop
            offset="1"
            stopColor={
              person === 1 ? "#cfc4a8" : person === 2 ? "#681d43" : "#34215d"
            }
          />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-circle)`}>
        <path fill={background} d="M0 0h120v120H0z" />
        <circle cx="89" cy="27" r="32" fill="white" opacity=".18" />
        {person !== 1 && (
          <path
            fill="#211b27"
            d={
              person === 0
                ? "M26 92C15 78 13 38 29 22 45 4 85 9 97 33 108 55 98 85 90 96Z"
                : "M23 98Q14 47 33 20 55 5 79 19 111 33 99 100Z"
            }
          />
        )}
        {person === 0 && (
          <g fill="#27202d">
            {[
              [28, 33],
              [40, 20],
              [58, 16],
              [78, 23],
              [91, 38],
              [21, 55],
              [97, 59],
            ].map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="14" />
            ))}
          </g>
        )}
        <path
          fill={`url(#${id}-shirt)`}
          d="M9 124Q10 93 40 87L80 87Q110 93 112 124Z"
        />
        <path fill={skin} d="M46 74H75V94Q60 106 44 93Z" />
        <path
          fill="#562e26"
          opacity=".28"
          d="M46 75L76 74 73 87Q58 97 46 88Z"
        />
        <ellipse cx="33" cy="56" rx="6" ry="9" fill={skin} />
        <ellipse cx="86" cy="56" rx="6" ry="9" fill={skin} />
        <path
          fill={`url(#${id}-skin)`}
          d="M33 41Q33 20 59 19 85 19 87 43L83 66Q78 88 61 91 43 89 35 68Z"
        />
        {person === 1 ? (
          <>
            <path
              fill="#251f23"
              d="M32 48L30 30Q39 9 67 14 87 14 90 32L86 49 79 31Q56 34 41 31Z"
            />
            <path
              fill="#292024"
              d="M36 63Q42 74 48 74Q61 80 75 73L83 62 80 79Q65 100 46 84Z"
            />
            <path fill={skin} d="M46 67Q61 63 74 68L74 77Q60 84 47 76Z" />
          </>
        ) : person === 0 ? (
          <path
            fill="#241c27"
            d="M31 48L30 27Q56 5 83 24L90 47 79 41 73 29Q54 42 34 37Z"
          />
        ) : (
          <>
            <path
              fill="#30202a"
              d="M31 49Q28 18 62 17 89 13 89 44L83 53 78 30Q47 50 31 49Z"
            />
            <path
              d="M73 22Q50 39 32 41M79 26Q53 46 31 45"
              stroke="#624037"
              strokeWidth="2"
              fill="none"
            />
          </>
        )}
        <path
          d="M41 49q7-4 14 0M67 48q7-3 13 1"
          stroke="#422b27"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="49" cy="56" rx="2" ry="2.6" fill="#271e23" />
        <ellipse cx="74" cy="55" rx="2" ry="2.6" fill="#271e23" />
        <circle cx="49.5" cy="55.4" r=".6" fill="#fff" />
        <circle cx="74.5" cy="54.4" r=".6" fill="#fff" />
        <path
          d="M62 55l-3 10q3 3 7 0"
          stroke={skin}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M49 73q12 10 23-1"
          fill="#f7ddd0"
          stroke="#7c3b32"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {person !== 1 && (
          <g fill="none" stroke="#eeca63" strokeWidth="2.4">
            <ellipse cx="33" cy="68" rx="4" ry="7" />
            <ellipse cx="87" cy="67" rx="4" ry="7" />
          </g>
        )}
        <path
          d={
            person === 1
              ? "M38 89L52 103 60 96 68 104 83 90M61 100v23"
              : "M38 93q23 23 46 0"
          }
          stroke={person === 1 ? "#b7ab95" : "#d0a7da"}
          strokeWidth="2"
          fill="none"
        />
      </g>
      <circle
        cx="60"
        cy="60"
        r="58.5"
        fill="none"
        stroke="white"
        strokeOpacity=".8"
        strokeWidth="3"
      />
    </svg>
  );
}
