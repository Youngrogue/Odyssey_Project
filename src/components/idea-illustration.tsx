import type { Idea } from "@/lib/preview/ideas";
const pt = (x: number, y: number, z: number = 0) => [
  140 + (x - y) * 0.87,
  98 + (x + y) * 0.5 - z,
];
const points = (v: number[][]) => v.map((p) => p.join(",")).join(" ");
function Block({
  x,
  y,
  w,
  d,
  h,
  color,
  z = 0,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  color: string;
  z?: number;
}) {
  const a = pt(x, y, z + h),
    b = pt(x + w, y, z + h),
    c = pt(x + w, y + d, z + h),
    e = pt(x, y + d, z + h);
  return (
    <g
      stroke="#0f172a"
      strokeOpacity=".15"
      strokeWidth=".8"
      strokeLinejoin="round"
    >
      <polygon
        points={points([e, c, pt(x + w, y + d, z), pt(x, y + d, z)])}
        fill={color}
      />
      <polygon
        points={points([b, c, pt(x + w, y + d, z), pt(x + w, y, z)])}
        fill={color}
      />
      <polygon
        points={points([b, c, pt(x + w, y + d, z), pt(x + w, y, z)])}
        fill="#0f172a"
        opacity=".19"
      />
      <polygon points={points([a, b, c, e])} fill={color} />
      <polygon points={points([a, b, c, e])} fill="white" opacity=".24" />
    </g>
  );
}
function Cylinder({
  x,
  y,
  z = 0,
  r,
  h,
  color,
}: {
  x: number;
  y: number;
  z?: number;
  r: number;
  h: number;
  color: string;
}) {
  const [cx, cy] = pt(x, y, z);
  return (
    <g>
      <path
        d={`M${cx - r} ${cy - h}v${h}a${r} ${r * 0.5} 0 0 0 ${r * 2} 0v-${h}`}
        fill={color}
      />
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.5} fill={color} />
      <path
        d={`M${cx} ${cy + r * 0.5}a${r} ${r * 0.5} 0 0 0 ${r} -${r * 0.5}v-${h}h-${r}Z`}
        fill="#0f172a"
        opacity=".1"
      />
      <ellipse cx={cx} cy={cy - h} rx={r} ry={r * 0.5} fill={color} />
      <ellipse
        cx={cx}
        cy={cy - h}
        rx={r}
        ry={r * 0.5}
        fill="white"
        opacity=".3"
      />
    </g>
  );
}
export function IdeaIllustration({ symbol }: { symbol: Idea["symbol"] }) {
  const purple = "#7d73dd",
    navy = "#222c4b",
    yellow = "#facc15",
    coral = "#f66c7f";
  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      aria-hidden="true"
      className="idea-illustration"
    >
      <ellipse cx="140" cy="151" rx="95" ry="15" fill="#0f172a" opacity=".07" />
      <Block x={-60} y={-45} w={120} d={90} h={10} color="#fff" />
      {symbol === "games" && (
        <>
          <Block x={-36} y={-24} w={76} d={60} h={6} z={10} color={purple} />
          {[0, 1, 2, 3].flatMap((x) =>
            [0, 1, 2].map((y) => (
              <Block
                key={`${x}-${y}`}
                x={-32 + x * 17}
                y={-20 + y * 17}
                w={17}
                d={17}
                h={1}
                z={16}
                color={(x + y) % 2 ? "#fff" : navy}
              />
            )),
          )}
          <Cylinder x={-23} y={5} z={17} r={9} h={22} color={yellow} />
          <Cylinder x={12} y={-12} z={17} r={8} h={29} color={coral} />
          <Block x={-50} y={35} w={15} d={15} h={17} z={10} color={yellow} />
          <Block x={31} y={-37} w={17} d={17} h={5} z={10} color={coral} />
        </>
      )}
      {symbol === "dance" && (
        <>
          <Block x={-30} y={-20} w={55} d={52} h={12} z={10} color={purple} />
          <Cylinder x={-3} y={6} z={22} r={28} h={3} color={navy} />
          <Cylinder x={-3} y={6} z={25} r={10} h={1} color={yellow} />
          <Block x={18} y={-37} w={26} d={22} h={55} z={10} color={navy} />
          <g transform="translate(181 82) skewY(30)">
            <circle r="9" fill={yellow} />
            <circle r="4" fill={navy} />
            <circle cy="-24" r="6" fill={purple} />
          </g>
          <path
            d="M94 61V33l17-5v22"
            stroke={navy}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <ellipse cx="87" cy="62" rx="7" ry="5" fill={navy} />
          <ellipse cx="105" cy="51" rx="7" ry="5" fill={navy} />
        </>
      )}
      {symbol === "clay" && (
        <>
          <Block x={-28} y={-17} w={57} d={47} h={25} z={10} color={coral} />
          <Cylinder x={2} y={9} z={35} r={28} h={4} color={navy} />
          <Cylinder x={2} y={9} z={39} r={15} h={23} color="#d69a70" />
          <g transform={`translate(${pt(2, 9, 62).join(" ")})`}>
            <ellipse rx="11" ry="5.5" fill="#895338" />
            <ellipse rx="7" ry="3" fill="#643d2e" />
          </g>
          <Cylinder x={-43} y={25} z={10} r={12} h={15} color={yellow} />
          <Cylinder x={38} y={-24} z={10} r={11} h={32} color={purple} />
          <path
            d="m195 70 2-23m-7 25 1-18"
            stroke={navy}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      {symbol === "food" && (
        <>
          <Block x={-44} y={-26} w={88} d={58} h={17} z={10} color={yellow} />
          <Cylinder x={-3} y={7} z={27} r={35} h={5} color="#fff" />
          <Cylinder x={-3} y={7} z={32} r={23} h={7} color={coral} />
          <path
            d="m129 73 11 6 9-5m-15 5 7 8 10-5"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Cylinder x={27} y={-17} z={27} r={10} h={27} color={purple} />
          <path
            d="m99 87 19 11m-13-11 15 9m41 17 18-11"
            stroke={navy}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {symbol === "book" && (
        <>
          <Block x={-34} y={-18} w={66} d={51} h={10} z={10} color={coral} />
          <Block x={-29} y={-23} w={66} d={51} h={10} z={20} color={purple} />
          <Block x={-34} y={-20} w={66} d={51} h={10} z={30} color={yellow} />
          <path
            d="m116 62 21 12 15-9m-16 11 12-7"
            stroke={navy}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <Cylinder x={-45} y={-32} z={10} r={10} h={21} color={purple} />
          <Cylinder x={42} y={23} z={10} r={12} h={14} color="#d8edc9" />
          <path
            d="M160 119v-18m0 10q-15-18-17-6t17 10m0-3q13-22 18-9t-18 13"
            stroke="#3d6d4d"
            fill="#689b65"
            strokeWidth="2"
          />
        </>
      )}
      {symbol === "compass" && (
        <>
          <Block x={-37} y={-26} w={74} d={63} h={8} z={10} color={purple} />
          <Cylinder x={0} y={3} z={18} r={32} h={8} color={yellow} />
          <Cylinder x={0} y={3} z={26} r={26} h={1} color="#fff" />
          <path d="m141 54 15 18-25 10 2-16Z" fill={navy} />
          <path d="m141 54-1 16-9 12 2-16Z" fill={coral} />
          <Block x={-48} y={27} w={14} d={14} h={27} z={10} color={coral} />
          <Block x={32} y={-34} w={16} d={16} h={38} z={10} color={navy} />
        </>
      )}
      <path
        d="m227 29 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"
        fill="currentColor"
        opacity=".65"
      />
    </svg>
  );
}
