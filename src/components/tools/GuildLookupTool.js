import { useState } from "react";
import { ExternalLink, Loader2, Search, Server } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ToolPanel, {
  ToolSection,
  FieldLabel,
  CopyField,
  StatGrid,
  StatCard,
  EmptyState,
} from "../ToolPanel";
import { parseGuildId } from "../../lib/guilds";
import { cn } from "@/lib/utils";

function InfoRow({ label, value, mono, children }) {
  if ((value == null || value === "") && !children) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-[var(--nx-border)] last:border-0">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nx-text-faint)] w-36 shrink-0 pt-0.5">
        {label}
      </span>
      {children || (
        <span
          className={cn(
            "text-sm text-[var(--nx-text-heading)] break-all",
            mono && "font-mono text-[var(--nx-accent)]"
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}

function formatCreated(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function formatCount(value) {
  if (value == null) return "—";
  return Number(value).toLocaleString();
}

export default function GuildLookupTool() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const lookup = async (e) => {
    e?.preventDefault();
    const id = parseGuildId(input);
    if (!id) {
      setError("Enter a valid guild snowflake ID.");
      setData(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/guild-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: input }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Lookup failed.");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Network error — try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const sources = data?.source
    ? [
        data.source.guild && "Bot member",
        data.source.preview && "Preview",
        data.source.widget && "Widget",
        data.source.invite && "Invite",
      ].filter(Boolean)
    : [];

  return (
    <ToolPanel fill>
      <ToolSection
        title="Lookup"
        description="Resolve a guild by snowflake — requires bot token in settings"
      >
        <form onSubmit={lookup}>
          <FieldLabel hint="Server snowflake ID">Guild ID</FieldLabel>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Snowflake ID"
              className="font-mono text-sm flex-1 min-w-0"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 w-full sm:w-auto"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Lookup
            </Button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-[var(--nx-red)]">{error}</p>}
      </ToolSection>

      {!data && !error && (
        <EmptyState
          icon={Server}
          title="Look up a guild"
          description="Paste a Discord server ID to see members, boosts, features, and CDN assets."
        />
      )}

      {data && (
        <>
          <StatGrid>
            <StatCard label="Members" value={formatCount(data.memberCount)} accent />
            <StatCard label="Online" value={formatCount(data.presenceCount)} />
            <StatCard
              label="Boosts"
              value={
                data.premiumSubscriptionCount != null
                  ? formatCount(data.premiumSubscriptionCount)
                  : data.premiumTierLabel || "—"
              }
            />
            <StatCard label="Features" value={data.features?.length ?? 0} />
          </StatGrid>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            <ToolSection
              title="Server"
              action={
                data.inviteUrl ? (
                  <a
                    href={data.inviteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--nx-accent)] hover:underline"
                  >
                    Join <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null
              }
            >
              {(data.banner || data.splash) && (
                <div className="mb-4 -mx-1 overflow-hidden rounded-xl border border-[var(--nx-border)]">
                  <img
                    src={data.banner || data.splash}
                    alt=""
                    className="w-full h-24 sm:h-28 object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                {data.icon && (
                  <img
                    src={data.icon}
                    alt=""
                    className="w-14 h-14 rounded-2xl border border-[var(--nx-border)]"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-lg font-bold text-[var(--nx-text-heading)] truncate flex items-center gap-2">
                    {data.name}
                    {data.badges?.map((badge) => (
                      <span
                        key={badge.id || badge.key}
                        className="inline-flex items-center"
                        title={badge.name}
                      >
                        {badge.iconUrl && (
                          <img src={badge.iconUrl} alt={badge.name} className="w-4 h-4" />
                        )}
                      </span>
                    ))}
                  </p>
                  {data.description && (
                    <p className="text-xs text-[var(--nx-text-muted)] mt-1 line-clamp-2">
                      {data.description}
                    </p>
                  )}
                </div>
              </div>

              <CopyField label="Guild ID" value={data.id} />
              {data.inviteUrl && (
                <div className="mt-3">
                  <CopyField label="Invite URL" value={data.inviteUrl} />
                </div>
              )}
              {data.vanityUrlCode && (
                <div className="mt-3">
                  <CopyField label="Vanity" value={data.vanityUrlCode} />
                </div>
              )}

              <div className="mt-4 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-4">
                <InfoRow label="Created" value={formatCreated(data.createdAt)} />
                <InfoRow label="Owner ID" value={data.ownerId} mono />
                <InfoRow label="Boost tier" value={data.premiumTierLabel} />
                <InfoRow
                  label="Boost count"
                  value={
                    data.premiumSubscriptionCount != null
                      ? formatCount(data.premiumSubscriptionCount)
                      : null
                  }
                />
                <InfoRow label="Verification" value={data.verificationLevel} />
                <InfoRow label="NSFW level" value={data.nsfwLevel} />
                <InfoRow label="Locale" value={data.preferredLocale} />
                <InfoRow
                  label="Emojis"
                  value={data.emojiCount != null ? formatCount(data.emojiCount) : null}
                />
                <InfoRow
                  label="Stickers"
                  value={data.stickerCount != null ? formatCount(data.stickerCount) : null}
                />
                <InfoRow label="Sources" value={sources.join(" · ") || null} />
              </div>
            </ToolSection>

            <ToolSection title="Features & assets">
              {data.badges?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.badges.map((badge) => (
                    <span
                      key={badge.id || badge.key}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-lg bg-[var(--nx-bg-overlay)] border border-[var(--nx-border)] text-[var(--nx-text)]"
                    >
                      {badge.iconUrl && (
                        <img src={badge.iconUrl} alt="" className="w-4 h-4" />
                      )}
                      {badge.name}
                    </span>
                  ))}
                </div>
              )}

              {data.featureDetails?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-4 max-h-48 overflow-y-auto scrollbar-visible">
                  {data.featureDetails.map((f) => (
                    <span
                      key={f.id}
                      title={f.description}
                      className="text-[10px] font-mono px-2 py-1 rounded-md bg-[var(--nx-bg-overlay)] border border-[var(--nx-border)] text-[var(--nx-text-muted)]"
                    >
                      {f.id}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--nx-text-muted)] mb-4">No features reported.</p>
              )}

              <CopyField label="Icon URL" value={data.icon} />
              {data.banner && (
                <div className="mt-3">
                  <CopyField label="Banner URL" value={data.banner} />
                </div>
              )}
              {data.splash && (
                <div className="mt-3">
                  <CopyField label="Splash URL" value={data.splash} />
                </div>
              )}
              {data.discoverySplash && (
                <div className="mt-3">
                  <CopyField label="Discovery splash" value={data.discoverySplash} />
                </div>
              )}

              {data.widgetChannels?.length > 0 && (
                <div className="mt-4 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--nx-text-faint)] pt-3 pb-1">
                    Widget channels
                  </p>
                  {data.widgetChannels
                    .slice()
                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                    .map((ch) => (
                      <InfoRow key={ch.id} label={`#${ch.name}`} value={ch.id} mono />
                    ))}
                </div>
              )}

              {!data.source?.guild && (
                <p className="mt-4 text-xs text-[var(--nx-text-muted)]">
                  Limited data — the bot is not in this guild. Public widget, Discovery preview,
                  or vanity invite filled what&apos;s available.
                </p>
              )}
            </ToolSection>
          </div>
        </>
      )}
    </ToolPanel>
  );
}
