import React from "react";
import { DEV_TEAM_URL, DISCORD_URL, PUBLISHER } from "@/lib/seo";

const LINKS = [
  {
    href: DISCORD_URL,
    label: "Discord",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.889-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12" />
      </svg>
    ),
  },
];

export default function NexusFooter() {
  return (
    <footer className="shrink-0 border-t border-[var(--nx-border)] nx-glass-strong px-4 sm:px-6 lg:px-8 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2.5">
        <p className="text-[10px] sm:text-[11px] text-[var(--nx-text-faint)] leading-snug text-center sm:text-left">
          <span className="text-[var(--nx-text-muted)] font-semibold">Nexus</span>
          {" · "}
          Made by{" "}
          <a
            href={DEV_TEAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--nx-text-muted)] hover:text-[var(--nx-accent)] transition-colors"
          >
            {PUBLISHER}
          </a>
          {" · "}© {new Date().getFullYear()}
          <span className="block sm:inline">
            <span className="hidden sm:inline"> · </span>
            Not affiliated with Discord Inc.
          </span>
        </p>
        <div className="flex items-center justify-center sm:justify-end gap-1.5 shrink-0">
          {LINKS.map(({ href, label, icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-[var(--nx-text-faint)] hover:text-[var(--nx-text)] hover:bg-[var(--nx-hover-bg)] border border-transparent hover:border-[var(--nx-border)] transition-all"
            >
              {icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
