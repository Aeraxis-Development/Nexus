import {
  Home,
  Shield,
  Link2,
  Bot,
  Hash,
  Binary,
  LayoutTemplate,
  Webhook,
  Palette,
  Clock,
  Menu,
  X,
  Command,
  Type,
  Radio,
  BadgeCheck,
  AtSign,
  ExternalLink,
  Image,
  AppWindow,
  Component,
  Lock,
  Ticket,
  Sparkles,
  BarChart3,
  MessageSquareReply,
  Gauge,
  Code2,
  Layers,
  User,
  Server,
  Languages,
  FileStack,
  ShieldAlert,
  Activity,
  Calendar,
  BookOpen,
  Lightbulb,
  Globe2,
  History,
  EyeOff,
  Smile,
  MessageSquare,
  Bell,
  ALargeSmall,
  ListChecks,
  Regex,
  Rainbow,
  Highlighter,
} from "lucide-react";
import Logo from "./Logo";
import ThemeSwitcher from "./ThemeSwitcher";
import DiscordAuthButton from "./DiscordAuthButton";
import { cn } from "@/lib/utils";

export const TOOL_GROUPS = [
  {
    id: "access",
    label: "Access",
    tools: [
      { id: "permissions", label: "Permissions", icon: Shield, description: "Calculate bot permission flags" },
      { id: "decoder", label: "Perm Decoder", icon: Binary, description: "Parse permission integers" },
      { id: "overwrites", label: "Overwrites", icon: Lock, description: "Build channel permission overwrites" },
      { id: "effective", label: "Effective Perms", icon: Layers, description: "Resolve final channel permissions" },
      { id: "oauth", label: "OAuth Invite", icon: Link2, description: "Generate invite URLs" },
      { id: "intents", label: "Gateway Intents", icon: Radio, description: "Calculate bot intent flags" },
    ],
  },
  {
    id: "identity",
    label: "Identity",
    tools: [
      { id: "application", label: "Application Lookup", icon: Bot, description: "Fetch application info" },
      { id: "user", label: "User Lookup", icon: User, description: "Resolve users by snowflake ID" },
      { id: "username-history", label: "Username History", icon: History, description: "Track username & display name changes" },
      { id: "guild", label: "Guild Lookup", icon: Server, description: "Resolve servers by snowflake ID" },
      { id: "invite", label: "Invite Lookup", icon: Ticket, description: "Resolve invite codes & links" },
      { id: "vanity", label: "Vanity Checker", icon: Globe2, description: "See if a discord.gg slug is already in use" },
      { id: "username", label: "Username Checker", icon: AtSign, description: "Check @username availability" },
      { id: "template", label: "Template Lookup", icon: FileStack, description: "Resolve discord.new templates" },
      { id: "snowflake", label: "Snowflake", icon: Hash, description: "Decode Discord IDs" },
      { id: "flags", label: "Flags", icon: BadgeCheck, description: "User, app & message flag bitfields" },
      { id: "features", label: "Guild Features", icon: Sparkles, description: "Guild features & system channel flags" },
      { id: "presence", label: "Rich Presence", icon: Activity, description: "Build status & activity payloads" },
    ],
  },
  {
    id: "creator",
    label: "Creator",
    tools: [
      { id: "font", label: "Font Generator", icon: ALargeSmall, description: "Stylish Unicode fonts & symbols" },
      { id: "spoiler", label: "Spoiler Generator", icon: EyeOff, description: "Wrap text in spoiler markup" },
      { id: "status-ideas", label: "Status Generator", icon: Smile, description: "Creative custom status ideas" },
      { id: "fake-message", label: "Fake Message", icon: MessageSquare, description: "Realistic message screenshots" },
      { id: "pfp-ring", label: "Pfp Ring", icon: Rainbow, description: "Pride rings & profile frames" },
      { id: "fake-ping", label: "Fake Ping", icon: Bell, description: "Notification badges for mockups" },
      { id: "ansi", label: "Color Text", icon: Highlighter, description: "Colored Discord ANSI text" },
    ],
  },
  {
    id: "messages",
    label: "Messages",
    tools: [
      { id: "embed", label: "Embed Builder", icon: LayoutTemplate, description: "Build message embeds" },
      { id: "components", label: "Components", icon: Component, description: "Buttons, selects & modals" },
      { id: "interactions", label: "Interactions", icon: MessageSquareReply, description: "Build interaction response JSON" },
      { id: "poll", label: "Polls", icon: BarChart3, description: "Build message poll JSON" },
      { id: "slash", label: "Slash Commands", icon: Command, description: "Build application command JSON" },
      { id: "localizations", label: "Localizations", icon: Languages, description: "Command name & description locales" },
      { id: "markdown", label: "Markdown", icon: Type, description: "Format and preview message text" },
      { id: "webhook", label: "Webhook", icon: Webhook, description: "Create webhook payloads" },
      { id: "mentions", label: "Mentions", icon: AtSign, description: "Build & parse Discord mentions" },
      { id: "timestamp", label: "Timestamp", icon: Clock, description: "Discord timestamps" },
    ],
  },
  {
    id: "guild-tools",
    label: "Guild",
    tools: [
      { id: "automod", label: "AutoMod", icon: ShieldAlert, description: "Build AutoMod rule JSON" },
      { id: "automod-regex", label: "Automod Regex", icon: Regex, description: "Generate AutoMod regex patterns" },
      { id: "server-ads", label: "Server Ads Checklist", icon: ListChecks, description: "Places to advertise your server" },
      { id: "events", label: "Scheduled Events", icon: Calendar, description: "Build scheduled event JSON" },
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    tools: [
      { id: "limits", label: "Limits", icon: Gauge, description: "Validate Discord hard limits" },
      { id: "export", label: "Code Export", icon: Code2, description: "JSON → discord.js / discord.py" },
      { id: "cookbook", label: "API Cookbook", icon: BookOpen, description: "cURL & fetch for common REST routes" },
      { id: "links", label: "Message Links", icon: ExternalLink, description: "Parse & build jump URLs" },
      { id: "cdn", label: "CDN Assets", icon: Image, description: "Build Discord CDN URLs" },
      { id: "widgets", label: "Widgets", icon: AppWindow, description: "User, server & application widgets by ID" },
      { id: "color", label: "Color Converter", icon: Palette, description: "Decimal ↔ hex colors" },
    ],
  },
];

export const TOOLS = [
  { id: "home", label: "Browse", icon: Home, description: "Browse all utilities" },
  ...TOOL_GROUPS.flatMap((g) => g.tools),
];

function NavToolButton({ tool, active, onClick }) {
  const Icon = tool.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={tool.description}
      className={cn("nx-nav-item", active && "nx-nav-item-active")}
    >
      <span className="nx-nav-icon">
        <Icon className={cn("w-4 h-4", active ? "text-white" : "text-[var(--nx-text-muted)]")} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold truncate">{tool.label}</div>
        <div className="text-[11px] text-[var(--nx-text-faint)] truncate font-normal">{tool.description}</div>
      </div>
    </button>
  );
}

function SidebarNav({ activeTool, onSelect }) {
  return (
    <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-visible px-2 py-2">
      <NavToolButton
        tool={TOOLS[0]}
        active={activeTool === "home"}
        onClick={() => onSelect("home")}
      />

      {TOOL_GROUPS.map((group) => (
        <div key={group.id} className="mt-3">
          <div className="nx-nav-group">{group.label}</div>
          <div className="space-y-0.5">
            {group.tools.map((tool) => (
              <NavToolButton
                key={tool.id}
                tool={tool}
                active={activeTool === tool.id}
                onClick={() => onSelect(tool.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function Sidebar({
  activeTool,
  onToolChange,
  mobileOpen,
  onMobileToggle,
  onMobileClose,
  onRequestTool,
  onSubmitReview,
}) {
  const selectTool = (id) => {
    onToolChange(id);
    onMobileClose?.();
  };

  return (
    <>
      <header className="md:hidden shrink-0 relative z-[60] nx-glass-strong border-b border-[var(--nx-border)]">
        <div className="flex items-center gap-3 px-4 h-[56px]">
          <button
            type="button"
            onClick={() => selectTool("home")}
            className="flex items-center gap-2.5 min-w-0 text-left rounded-lg hover:opacity-90 transition-opacity"
          >
            <Logo className="h-8 w-auto" />
            <span className="nx-wordmark text-base">Nexus</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <DiscordAuthButton compact className="shrink-0" onSubmitReview={onSubmitReview} />
            <ThemeSwitcher />
            <button
              type="button"
              onClick={onMobileToggle}
              className="flex items-center justify-center w-10 h-10 rounded-[10px] border border-[var(--nx-border)] bg-[var(--nx-bg-surface)] hover:bg-[var(--nx-hover-bg)] transition-colors"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-[var(--nx-text)]" />
              ) : (
                <Menu className="w-5 h-5 text-[var(--nx-text)]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed top-[56px] inset-x-0 bottom-0 nx-modal-overlay z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed md:static top-[56px] bottom-0 md:inset-y-auto left-0 z-50 md:z-auto",
          "flex flex-col w-[288px] shrink-0",
          "nx-glass-strong border-r border-[var(--nx-border)]",
          "bg-[var(--nx-bg-sidebar)]",
          "transition-transform duration-200 ease-out",
          "md:translate-x-0 md:top-auto md:bottom-auto md:overflow-visible",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="hidden md:flex items-center gap-3 px-4 h-[68px] shrink-0 border-b border-[var(--nx-border)]">
          <button
            type="button"
            onClick={() => selectTool("home")}
            className="flex items-center gap-3 min-w-0 text-left rounded-lg hover:opacity-90 transition-opacity"
          >
            <Logo className="h-9 w-auto" />
            <span className="nx-wordmark">Nexus</span>
          </button>
        </div>

        <SidebarNav activeTool={activeTool} onSelect={selectTool} />

        <div className="flex flex-col gap-3 px-4 py-3 shrink-0 border-t border-[var(--nx-border)] relative z-20 overflow-visible">
          {onRequestTool && (
            <button
              type="button"
              onClick={onRequestTool}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-surface)] hover:bg-[var(--nx-hover-bg)] hover:border-[var(--nx-border-accent)] text-left transition-colors"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--nx-accent-soft)] border border-[var(--nx-border-accent)] shrink-0">
                <Lightbulb className="w-4 h-4 text-[var(--nx-accent)]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-[var(--nx-text-heading)]">Request a tool</span>
                <span className="block text-[11px] text-[var(--nx-text-faint)] truncate">
                  Suggest ideas & track yours
                </span>
              </span>
            </button>
          )}
          <div className="flex flex-col gap-3">
            <DiscordAuthButton side="top" onSubmitReview={onSubmitReview} />
            <div className="hidden md:flex items-center justify-between gap-2">
              <span className="text-[11px] text-[var(--nx-text-faint)] font-medium">Theme</span>
              <ThemeSwitcher side="top" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
