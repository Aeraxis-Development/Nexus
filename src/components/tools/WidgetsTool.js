import { useEffect, useMemo, useState } from "react";
import { Bot, Loader2, Search, Server, User } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import ColorPicker from "../ui/ColorPicker";
import ToolPanel, { ToolSection, FieldLabel, CopyField, CopyCodeBlock, EmptyState } from "../ToolPanel";
import { cn } from "@/lib/utils";
import { sanitizeSnowflake } from "../../lib/cdn";
import { deriveAccentPalette, normalizeHex } from "../../lib/colors";
import {
  WIDGET_STYLES,
  WIDGET_THEMES,
  buildWidgetEmbedSnippet,
  buildWidgetHtml,
  estimateWidgetHeight,
  widgetCacheTimestamp,
} from "../../lib/widgetRender";

const DEFAULT_CUSTOM = "#5865f2";

const TYPES = [
  {
    id: "user",
    label: "User",
    icon: User,
    placeholder: "User ID",
    hint: "Bot token only — no shared server needed",
  },
  {
    id: "guild",
    label: "Server",
    icon: Server,
    placeholder: "Server ID",
    hint: "Uses Discord’s public widget or discovery preview API",
  },
  {
    id: "app",
    label: "Application",
    icon: Bot,
    placeholder: "Application ID",
    hint: "Bot token only — no shared server needed",
  },
];

export default function WidgetsTool() {
  const [type, setType] = useState("app");
  const [id, setId] = useState("");
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestedType, setSuggestedType] = useState(null);
  const [style, setStyle] = useState("card");
  const [theme, setTheme] = useState("signal");
  const [customAccent, setCustomAccent] = useState(DEFAULT_CUSTOM);
  const [useCustom, setUseCustom] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const activeType = TYPES.find((t) => t.id === type) || TYPES[2];
  const accent = useCustom ? normalizeHex(customAccent) || DEFAULT_CUSTOM : undefined;
  const customPreview =
    deriveAccentPalette(customAccent)?.preview ||
    `linear-gradient(135deg, ${customAccent}, ${customAccent})`;

  const previewHtml = useMemo(() => {
    if (!entity) return "";
    return buildWidgetHtml(entity, {
      style,
      theme,
      accent: useCustom ? accent : null,
      standalone: false,
    });
  }, [entity, style, theme, useCustom, accent]);

  const widgetUrl = useMemo(() => {
    if (!origin || !entity?.id) return "";
    const params = new URLSearchParams({
      type,
      id: entity.id,
      style,
      theme,
      t: widgetCacheTimestamp(),
    });
    if (accent) params.set("accent", accent.replace(/^#/, ""));
    return `${origin}/api/widget?${params.toString()}`;
  }, [origin, entity, type, style, theme, accent]);

  const embedHeight = useMemo(() => estimateWidgetHeight(style), [style]);

  const embedSnippet = useMemo(() => {
    if (!entity?.id) return "";
    return buildWidgetEmbedSnippet(
      { type, id: entity.id, style, theme, accent, t: widgetCacheTimestamp() },
      origin || "https://your-domain.com"
    ).replace(/height="\d+"/, `height="${embedHeight}"`);
  }, [entity, type, style, theme, accent, origin, embedHeight]);

  const switchType = (next) => {
    setType(next);
    setEntity(null);
    setError("");
    setSuggestedType(null);
  };

  const selectPreset = (presetId) => {
    setUseCustom(false);
    setTheme(presetId);
  };

  const selectCustom = () => {
    setUseCustom(true);
  };

  const lookup = async (overrideType) => {
    const snowflake = sanitizeSnowflake(id);
    if (!/^\d{17,20}$/.test(snowflake)) {
      setError("Enter a valid Discord snowflake ID.");
      setSuggestedType(null);
      return;
    }

    const nextType = typeof overrideType === "string" ? overrideType : null;
    const lookupType = nextType || type;
    if (nextType && nextType !== type) {
      setType(nextType);
    }

    setLoading(true);
    setError("");
    setSuggestedType(null);
    setId(snowflake);

    try {
      const res = await fetch("/api/widget-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: lookupType, id: snowflake }),
      });
      const raw = await res.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        setEntity(null);
        setError(res.ok ? "Invalid server response." : `Lookup failed (${res.status}).`);
        setSuggestedType(null);
        return;
      }
      if (!res.ok) {
        setEntity(null);
        setError(data?.error || `Lookup failed (${res.status}).`);
        setSuggestedType(data?.suggestedType || null);
        return;
      }
      setEntity(data);
      if (data?.accentColor && !useCustom) {
        setCustomAccent(normalizeHex(data.accentColor) || DEFAULT_CUSTOM);
      }
    } catch (err) {
      setEntity(null);
      setError(err?.message ? `Request failed: ${err.message}` : "Request failed.");
      setSuggestedType(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPanel fill>
      <div className="flex flex-wrap gap-2">
        {TYPES.map((item) => {
          const Icon = item.icon;
          const active = type === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchType(item.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors",
                active
                  ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)] text-[var(--nx-text-heading)]"
                  : "border-[var(--nx-border)] text-[var(--nx-text-muted)] hover:bg-[var(--nx-hover-bg)]"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-3 sm:space-y-4">
          <ToolSection title="Lookup" description={activeType.hint} className="overflow-visible">
            <FieldLabel>{activeType.label} ID</FieldLabel>
            <div className="flex gap-2 items-center">
              <Input
                value={id}
                onChange={(e) => setId(e.target.value)}
                onBlur={() => setId(sanitizeSnowflake(id))}
                placeholder={activeType.placeholder}
                className="font-mono w-full min-w-0 flex-1"
                onKeyDown={(e) => e.key === "Enter" && lookup()}
              />
              <Button
                onClick={() => lookup()}
                disabled={loading || !id.trim()}
                className="shrink-0 h-10"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Fetch
              </Button>
            </div>
            {error && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-[var(--nx-red)]">{error}</p>
                {suggestedType && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => lookup(suggestedType)}
                    disabled={loading}
                  >
                    Switch to {TYPES.find((t) => t.id === suggestedType)?.label || suggestedType} and fetch
                  </Button>
                )}
              </div>
            )}
          </ToolSection>

          <ToolSection title="Appearance">
            <FieldLabel>Style</FieldLabel>
            <div className="flex flex-wrap gap-2 mb-4">
              {WIDGET_STYLES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStyle(item.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border",
                    style === item.id
                      ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)] text-[var(--nx-text-heading)]"
                      : "border-[var(--nx-border)] text-[var(--nx-text-muted)]"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <FieldLabel>Gradient</FieldLabel>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {WIDGET_THEMES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => selectPreset(item.id)}
                  className={cn(
                    "aspect-square rounded-lg border-2 transition-transform",
                    !useCustom && theme === item.id
                      ? "border-[var(--nx-accent)] scale-105"
                      : "border-transparent opacity-80"
                  )}
                  style={{ background: item.preview }}
                  aria-label={item.label}
                />
              ))}
              <button
                type="button"
                title="Custom"
                onClick={selectCustom}
                className={cn(
                  "aspect-square rounded-lg border-2 transition-transform",
                  useCustom ? "border-[var(--nx-accent)] scale-105" : "border-transparent opacity-80"
                )}
                style={{ background: customPreview }}
                aria-label="Custom gradient"
                aria-pressed={useCustom}
              />
            </div>

            {useCustom && (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-3 py-2.5">
                <ColorPicker
                  value={customAccent}
                  onChange={(hex) => setCustomAccent(normalizeHex(hex) || DEFAULT_CUSTOM)}
                  aria-label="Custom card gradient color"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--nx-text-heading)]">Custom</p>
                  <p className="text-[11px] text-[var(--nx-text-faint)] font-mono uppercase truncate">
                    {normalizeHex(customAccent) || DEFAULT_CUSTOM}
                  </p>
                </div>
              </div>
            )}
            {!useCustom && (
              <p className="text-[11px] text-[var(--nx-text-faint)]">
                {WIDGET_THEMES.find((t) => t.id === theme)?.label || "Signal"}
              </p>
            )}
          </ToolSection>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <ToolSection title="Live preview" description="Fetched from Discord by ID — not Discord’s official widget">
            {entity ? (
              <div className="rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] p-4 sm:p-6 flex justify-center min-h-[200px]">
                <div
                  className="w-full max-w-[420px]"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            ) : (
              <EmptyState
                icon={activeType.icon}
                title={`Fetch a ${activeType.label.toLowerCase()}`}
                description={`Enter a ${activeType.label.toLowerCase()} ID and hit Fetch to generate a Nexus widget.`}
              />
            )}
          </ToolSection>

          <ToolSection title="Embed" description={entity ? `~${embedHeight}px tall` : "Available after lookup"}>
            <CopyField label="Widget URL" value={widgetUrl} placeholder="Widget URL" />
            <div className="mt-4">
              <CopyCodeBlock
                label="Iframe embed"
                description="Live widget — stays in sync with Discord data"
                value={embedSnippet || "<!-- Fetch a user, guild, or app ID first -->"}
                emptyHint={!entity ? "Lookup an ID to generate embed code" : undefined}
              />
            </div>
          </ToolSection>
        </div>
      </div>
    </ToolPanel>
  );
}
