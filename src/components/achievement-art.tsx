import { useId } from "react";

export function AchievementArt({
  compact = false,
  place = 0,
}: {
  compact?: boolean;
  place?: number;
}) {
  const id = useId().replaceAll(":", "");
  const metal =
    place === 1
      ? ["#f3eeff", "#a69abd", "#685b82"]
      : place === 2
        ? ["#ffe2c0", "#d69763", "#995537"]
        : ["#fff0a0", "#edbd37", "#a56c13"];
  return (
    <svg
      className={compact ? "achievement-medal" : "achievement-art"}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          {metal.map((color, i) => (
            <stop key={color} stopColor={color} offset={i / 2} />
          ))}
        </linearGradient>
        <linearGradient id={`${id}-inner`}>
          <stop stopColor={metal[2]} />
          <stop offset="1" stopColor={metal[1]} />
        </linearGradient>
      </defs>
      <ellipse cx="103" cy="174" rx="50" ry="8" fill="#281749" opacity=".1" />
      <path
        fill="#524095"
        d="M58 107L42 172 72 159 91 179 104 116ZM105 116L126 178 139 153 163 165 144 102Z"
      />
      <path
        fill="#8465c8"
        d="M66 115L53 154 73 146 84 161 95 119ZM112 119L127 159 138 142 151 151 137 108Z"
      />
      <path
        fill={metal[2]}
        d="M100 14L117 24 137 24 147 42 163 54 163 75 174 94 163 110 160 130 142 139 130 155 110 155 92 164 74 153 53 151 44 133 28 121 30 99 21 81 33 64 35 44 53 35 66 20 85 22Z"
      />
      <path
        fill={`url(#${id}-metal)`}
        d="M98 10L115 20 135 20 145 38 161 50 161 71 172 90 161 106 158 126 140 135 128 151 108 151 90 160 72 149 51 147 42 129 26 117 28 95 19 77 31 60 33 40 51 31 64 16 83 18Z"
      />
      <circle cx="96" cy="85" r="56" fill={`url(#${id}-inner)`} />
      <circle
        cx="96"
        cy="85"
        r="50"
        fill="none"
        stroke={metal[0]}
        strokeWidth="2"
        opacity=".8"
      />
      <path
        fill={metal[0]}
        d="M71 54H121L118 90Q113 108 101 111V123H118V133H74V123H91V111Q77 106 74 89Z"
      />
      <path
        d="M72 63H60Q57 88 78 91M120 63H133Q137 86 116 92"
        fill="none"
        stroke={metal[0]}
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        fill={metal[1]}
        d="M96 62L100 72 111 73 103 80 105 91 96 85 87 91 89 80 81 73 92 72Z"
      />
      {!compact && (
        <g fill={metal[1]}>
          <path d="M172 26l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" />
          <path d="M23 153l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
        </g>
      )}
    </svg>
  );
}
