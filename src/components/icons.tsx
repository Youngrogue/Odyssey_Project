import type { SVGProps } from "react";

type IconName =
  | "arrow"
  | "arrowUp"
  | "play"
  | "spark"
  | "check"
  | "compass"
  | "people"
  | "list"
  | "trophy"
  | "home"
  | "plus"
  | "minus"
  | "mail";
const paths: Record<IconName, React.ReactNode> = {
  arrow: (
    <>
      <path d="M4 12h15M13 5l7 7-7 7" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M5 19 19 5M5 5h14v14" />
    </>
  ),
  play: <path d="m9 5 11 7-11 7Z" fill="currentColor" strokeLinejoin="round" />,
  spark: (
    <path d="M12 2c1.5 7 3 8.5 10 10-7 1.5-8.5 3-10 10C10.5 15 9 13.5 2 12c7-1.5 8.5-3 10-10Z" />
  ),
  check: <path d="m5 12 4 4L19 6" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16 8-3 5-5 3 3-5Z" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2" />
    </>
  ),
  list: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="m8 9 1 1 2-2m2 1h3m-8 7 1 1 2-2m2 1h3" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 3h10v6a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4M12 14v6m-5 1h10" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
};
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
