import React from "react";
import { DEV_TEAM_URL, PUBLISHER } from "@/lib/seo";

export default function NexusFooter() {
  return (
    <footer className="shrink-0 border-t border-[var(--nx-border)] nx-glass-strong px-4 sm:px-6 lg:px-8 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <p className="text-[10px] sm:text-[11px] text-[var(--nx-text-faint)] leading-snug text-center">
        <span className="text-[var(--nx-text-muted)] font-semibold">© {new Date().getFullYear()} Nexus</span>
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
        <span className="block sm:inline">
          <span className="hidden sm:inline"> · </span>
          Not affiliated with Discord Inc.
        </span>
      </p>
    </footer>
  );
}
