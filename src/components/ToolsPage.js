import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import ToolPanel, { ToolSection } from "./ToolPanel";
import { TOOLS, TOOL_GROUPS } from "./Sidebar";

export const TOOL_META = {
  permissions: { tag: "Popular", blurb: "Toggle flags, apply presets, and copy the permission integer." },
  oauth: { tag: "Essential", blurb: "Build OAuth2 invite URLs with scopes and redirect parameters." },
  application: { tag: "Lookup", blurb: "Fetch public application metadata straight from Discord." },
  user: { tag: "New", blurb: "Resolve any user by snowflake — profile, badges, clan, and CDN assets." },
  "username-history": {
    tag: "New",
    blurb: "Track and look up username and display name changes Nexus has observed.",
  },
  guild: { tag: "New", blurb: "Resolve any server by snowflake — members, boosts, features, and assets." },
  snowflake: { tag: "Decode", blurb: "Break down user, channel, and guild IDs into timestamps." },
  decoder: { tag: "Reverse", blurb: "Turn a permission integer back into readable flag names." },
  embed: { tag: "Builder", blurb: "Compose embed JSON with a live preview before you paste." },
  slash: { tag: "Builder", blurb: "Design slash commands with options, choices, and subcommands." },
  markdown: { tag: "Preview", blurb: "Format message text with Discord markdown and see it live." },
  intents: { tag: "Calculator", blurb: "Toggle gateway intents and copy the integer for your client." },
  webhook: { tag: "Payload", blurb: "Craft webhook message bodies without guessing the schema." },
  color: { tag: "Convert", blurb: "Swap between decimal embed colors and hex values instantly." },
  timestamp: { tag: "Format", blurb: "Generate Discord timestamp markup for any date and style." },
  flags: { tag: "Bitfield", blurb: "Decode user, application, and message flag bitfields." },
  mentions: { tag: "Format", blurb: "Build and parse user, role, channel, emoji, and slash mentions." },
  links: { tag: "URL", blurb: "Parse jump URLs or build stable, PTB, and Canary message links." },
  cdn: { tag: "Assets", blurb: "Generate CDN URLs for avatars, banners, emojis, and guild assets." },
  widgets: { tag: "Embed", blurb: "Generate live user, server, and application widgets from Discord IDs." },
  components: { tag: "New", blurb: "Build buttons, select menus, and modal text inputs as JSON." },
  overwrites: { tag: "New", blurb: "Compose channel allow/deny overwrites for roles and members." },
  invite: { tag: "New", blurb: "Resolve invite codes to guild, channel, expiry, and member counts." },
  vanity: { tag: "New", blurb: "See whether a discord.gg slug is in use, reserved, or missing a public invite." },
  username: { tag: "New", blurb: "Check whether a unique Discord @username is available or taken." },
  features: { tag: "New", blurb: "Browse guild feature flags and system channel notification bits." },
  poll: { tag: "New", blurb: "Build Discord message poll JSON with answers and duration." },
  interactions: { tag: "New", blurb: "Craft interaction callbacks — reply, defer, update, autocomplete, modal." },
  limits: { tag: "New", blurb: "Paste message or command JSON and check it against Discord hard limits." },
  export: { tag: "New", blurb: "Turn message, embed, command, or interaction JSON into discord.js / discord.py." },
  effective: { tag: "New", blurb: "Stack roles and channel overwrites into a final permission bitfield." },
  localizations: { tag: "New", blurb: "Build command name and description localization maps for every Discord locale." },
  template: { tag: "New", blurb: "Resolve discord.new templates to roles, channels, and metadata." },
  automod: { tag: "New", blurb: "Compose AutoMod keyword, preset, spam, and mention rules as JSON." },
  "automod-regex": {
    tag: "New",
    blurb: "Generate and test Discord AutoMod regex for invites, scams, spam, and keywords.",
  },
  "server-ads": {
    tag: "New",
    blurb: "Checklist of directories and communities where you can advertise your Discord server.",
  },
  presence: { tag: "New", blurb: "Build gateway opcode 3 and bot rich presence activity payloads." },
  events: { tag: "New", blurb: "Create guild scheduled event JSON for stage, voice, or external venues." },
  cookbook: { tag: "New", blurb: "Copy cURL and fetch snippets for common Discord REST API routes." },
  font: { tag: "New", blurb: "Turn plain text into stylish Unicode fonts for usernames and messages." },
  spoiler: { tag: "New", blurb: "Wrap text in Discord spoiler markup — whole block, lines, words, or characters." },
  "status-ideas": {
    tag: "New",
    blurb: "Browse funny and creative Discord custom status ideas, then copy one in a click.",
  },
  "fake-message": {
    tag: "New",
    blurb: "Create realistic Discord message screenshots with custom names, colors, and avatars.",
  },
  "pfp-ring": {
    tag: "New",
    blurb: "Add pride rings, gradient borders, and frames to a Discord profile picture.",
  },
  "fake-ping": {
    tag: "New",
    blurb: "Generate Discord-style notification badges and ping icons for memes and mockups.",
  },
  ansi: {
    tag: "New",
    blurb: "Build colored Discord ANSI text for announcements, code blocks, and bot responses.",
  },
};

const toolItems = TOOLS.filter((t) => t.id !== "home");
const toolMap = Object.fromEntries(toolItems.map((t) => [t.id, t]));

function ToolCard({ tool, onOpen }) {
  const Icon = tool.icon;
  const meta = TOOL_META[tool.id];

  return (
    <button
      type="button"
      onClick={() => onOpen(tool.id)}
      className={cn(
        "group flex flex-col gap-3 p-3.5 sm:p-4 rounded-xl border border-[var(--nx-border)]",
        "bg-[var(--nx-bg-surface)] text-left w-full h-full",
        "hover:border-[var(--nx-border-accent)] hover:bg-[var(--nx-hover-bg)] transition-colors"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="nx-nav-icon w-10 h-10 group-hover:bg-[var(--nx-accent)] transition-all shrink-0">
          <Icon className="w-4 h-4 text-[var(--nx-text-muted)] group-hover:text-white transition-colors" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--nx-text-heading)] text-sm">{tool.label}</span>
            {meta?.tag && <span className="nx-badge">{meta.tag}</span>}
          </div>
          <p className="text-xs text-[var(--nx-text-muted)] leading-snug mt-1">
            {meta?.blurb || tool.description}
          </p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-[var(--nx-text-faint)] group-hover:text-[var(--nx-accent)] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>
    </button>
  );
}

export default function ToolsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");

  const openTool = (id) => router.push(`/#${id}`);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOL_GROUPS.map((group) => {
      const tools = group.tools
        .map((t) => toolMap[t.id])
        .filter(Boolean)
        .filter((tool) => {
          if (activeGroup !== "all" && group.id !== activeGroup) return false;
          if (!q) return true;
          const meta = TOOL_META[tool.id];
          const hay = `${tool.label} ${tool.description} ${meta?.blurb || ""} ${meta?.tag || ""}`.toLowerCase();
          return hay.includes(q);
        });
      return { ...group, tools };
    }).filter((group) => group.tools.length > 0);
  }, [query, activeGroup]);

  const visibleCount = filteredGroups.reduce((n, g) => n + g.tools.length, 0);

  return (
    <ToolPanel>
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nx-text-faint)] pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools…"
                className={cn(
                  "w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--nx-border-strong)]",
                  "bg-[var(--nx-bg-input)] text-sm text-[var(--nx-text)] placeholder:text-[var(--nx-text-faint)]",
                  "outline-none focus:border-[var(--nx-accent)] focus:ring-2 focus:ring-[var(--nx-accent)]/20"
                )}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveGroup("all")}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-semibold transition-colors",
                  activeGroup === "all"
                    ? "bg-[var(--nx-accent)] text-white"
                    : "border border-[var(--nx-border)] bg-[var(--nx-bg-surface)] text-[var(--nx-text-muted)] hover:bg-[var(--nx-hover-bg)]"
                )}
              >
                All
              </button>
              {TOOL_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroup(group.id)}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs font-semibold transition-colors",
                    activeGroup === group.id
                      ? "bg-[var(--nx-accent)] text-white"
                      : "border border-[var(--nx-border)] bg-[var(--nx-bg-surface)] text-[var(--nx-text-muted)] hover:bg-[var(--nx-hover-bg)]"
                  )}
                >
                  {group.label}
                </button>
              ))}
            </div>
        </div>

        <ToolSection
          title="Catalog"
          description={`Showing ${visibleCount} ${visibleCount === 1 ? "tool" : "tools"}${
            query.trim() || activeGroup !== "all" ? " matching your filters" : ""
          }`}
        >
          {filteredGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--nx-border-strong)] px-5 py-12 text-center">
              <p className="text-sm font-semibold text-[var(--nx-text-heading)] mb-1">No tools found</p>
              <p className="text-xs text-[var(--nx-text-muted)]">Try a different search or category.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGroups.map((group) => (
                <div key={group.id}>
                  <div className="flex items-baseline justify-between gap-3 mb-2.5">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--nx-text-faint)]">
                      {group.label}
                    </h2>
                    <span className="text-[10px] font-semibold tabular-nums text-[var(--nx-text-faint)]">
                      {group.tools.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-3">
                    {group.tools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} onOpen={openTool} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
