"use client";

import { useRef } from "react";
import { Icon } from "./icons";

const links = [
  ["#activity-ideas", "Activities"],
  ["#find-your-people", "Communities"],
  ["#questions", "FAQ"],
] as const;

export function SiteNavigation() {
  const menu = useRef<HTMLDetailsElement>(null);
  const items = (
    <>
      {links.map(([href, label]) => (
        <a key={href} href={href}>
          {label}
        </a>
      ))}
      <a className="header-cta" href="#waitlist">
        Join the waitlist <Icon name="arrowUp" />
      </a>
    </>
  );
  return (
    <>
      <nav className="desktop-navigation" aria-label="Main navigation">
        {items}
      </nav>
      <details
        className="mobile-navigation"
        ref={menu}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menu.current?.open) {
            menu.current.open = false;
            menu.current.querySelector("summary")?.focus();
          }
        }}
      >
        <summary>
          Menu <Icon name="plus" />
        </summary>
        <nav
          aria-label="Mobile navigation"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a") && menu.current)
              menu.current.open = false;
          }}
        >
          {items}
        </nav>
      </details>
    </>
  );
}
