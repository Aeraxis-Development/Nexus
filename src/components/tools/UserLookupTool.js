import { useState } from "react";
import { ExternalLink, Loader2, Search, User } from "lucide-react";
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
import { parseUserId } from "../../lib/users";
import { cn } from "@/lib/utils";

const STATUS_LABEL = {
  online: "Online",
  idle: "Idle",
  dnd: "Do Not Disturb",
  offline: "Offline",
};

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

export default function UserLookupTool() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const lookup = async (e) => {
    e?.preventDefault();
    const id = parseUserId(input);
    if (!id) {
      setError("Enter a valid user snowflake ID.");
      setData(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user-lookup", {
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

  const presenceStatus = data?.presence?.status;
  const statusLabel = presenceStatus ? STATUS_LABEL[presenceStatus] || presenceStatus : null;

  return (
    <ToolPanel fill>
      <ToolSection
        title="Lookup"
        description="Resolve a user by snowflake — requires bot token in settings"
      >
        <form onSubmit={lookup}>
          <FieldLabel hint="Paste an ID or <@mention>">User ID</FieldLabel>
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
          icon={User}
          title="Look up a user"
          description="Paste a Discord user ID to see profile, badges, clan tag, and CDN assets."
        />
      )}

      {data && (
        <>
          <StatGrid>
            <StatCard label="Account" value={data.bot ? "Bot" : "User"} accent />
            <StatCard label="Badges" value={data.badges?.length ?? 0} />
            <StatCard label="Flags" value={data.publicFlags ?? 0} mono />
            <StatCard label="Status" value={statusLabel || "—"} />
          </StatGrid>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            <ToolSection
              title="Profile"
              action={
                data.profileUrl ? (
                  <a
                    href={data.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--nx-accent)] hover:underline"
                  >
                    Open <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null
              }
            >
              {data.banner && (
                <div className="mb-4 -mx-1 overflow-hidden rounded-xl border border-[var(--nx-border)]">
                  <img
                    src={data.banner}
                    alt=""
                    className="w-full h-24 sm:h-28 object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="relative shrink-0">
                  <img
                    src={data.avatar}
                    alt=""
                    className="w-14 h-14 rounded-full border border-[var(--nx-border)]"
                  />
                  {data.avatarDecoration?.url && (
                    <img
                      src={data.avatarDecoration.url}
                      alt=""
                      className="absolute inset-0 w-14 h-14 pointer-events-none scale-[1.2]"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-[var(--nx-text-heading)] truncate flex items-center gap-2">
                    {data.displayName}
                    {data.bot && (
                      <span className="text-[10px] uppercase font-bold text-[var(--nx-accent)]">
                        Bot
                      </span>
                    )}
                    {data.clan?.tag && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-[var(--nx-bg-overlay)] border border-[var(--nx-border)] text-[var(--nx-text-muted)]">
                        {data.clan.badge && (
                          <img src={data.clan.badge} alt="" className="w-3.5 h-3.5" />
                        )}
                        {data.clan.tag}
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-mono text-[var(--nx-text-faint)] mt-0.5">
                    @{data.username}
                    {data.discriminator ? `#${data.discriminator}` : ""}
                  </p>
                </div>
              </div>

              <CopyField label="User ID" value={data.id} />
              <div className="mt-3">
                <CopyField label="Mention" value={data.mention} />
              </div>
              <div className="mt-3">
                <CopyField label="Profile URL" value={data.profileUrl} />
              </div>

              <div className="mt-4 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-4">
                <InfoRow label="Created" value={formatCreated(data.createdAt)} />
                <InfoRow label="Global name" value={data.globalName} />
                <InfoRow label="Username" value={data.username} mono />
                <InfoRow
                  label="Accent"
                  value={
                    data.accentColor
                      ? `${data.accentColor} (${data.accentColorDecimal})`
                      : null
                  }
                >
                  {data.accentColor ? (
                    <span className="inline-flex items-center gap-2 text-sm text-[var(--nx-text-heading)]">
                      <span
                        className="w-4 h-4 rounded-md border border-[var(--nx-border)] shrink-0"
                        style={{ backgroundColor: data.accentColor }}
                      />
                      <span className="font-mono text-[var(--nx-accent)]">
                        {data.accentColor}
                      </span>
                      <span className="text-[var(--nx-text-faint)]">
                        ({data.accentColorDecimal})
                      </span>
                    </span>
                  ) : null}
                </InfoRow>
                {data.presence && (
                  <>
                    <InfoRow
                      label="Presence"
                      value={STATUS_LABEL[data.presence.status] || data.presence.status}
                    />
                    <InfoRow
                      label="Custom status"
                      value={data.presence.customStatus?.text}
                    />
                    <InfoRow label="Last seen" value={data.presence.lastSeenLabel} />
                  </>
                )}
              </div>
            </ToolSection>

            <ToolSection title="Badges & assets">
              {data.badges?.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.badges.map((badge) => (
                    <span
                      key={badge.id || badge.key}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-lg bg-[var(--nx-bg-overlay)] border border-[var(--nx-border)] text-[var(--nx-text)]"
                      title={badge.name}
                    >
                      {badge.iconUrl && (
                        <img src={badge.iconUrl} alt="" className="w-4 h-4" />
                      )}
                      {badge.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--nx-text-muted)] mb-4">No public badges.</p>
              )}

              {data.flags?.length > 0 && (
                <div className="rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-4 mb-4">
                  {data.flags.map((flag) => (
                    <InfoRow key={flag.key} label={flag.key} value={flag.name} />
                  ))}
                </div>
              )}

              <CopyField label="Avatar URL" value={data.avatar} />
              {data.banner && (
                <div className="mt-3">
                  <CopyField label="Banner URL" value={data.banner} />
                </div>
              )}
              {data.avatarDecoration?.url && (
                <div className="mt-3">
                  <CopyField label="Decoration URL" value={data.avatarDecoration.url} />
                </div>
              )}
              {data.clan && (
                <div className="mt-4 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-4">
                  <InfoRow label="Clan tag" value={data.clan.tag} />
                  <InfoRow label="Clan guild" value={data.clan.guildId} mono />
                </div>
              )}

              {data.bot && (
                <p className="mt-4 text-xs text-[var(--nx-text-muted)]">
                  This ID is a bot account. Use{" "}
                  <a href="#application" className="text-[var(--nx-accent)] hover:underline font-semibold">
                    Application Lookup
                  </a>{" "}
                  for application metadata.
                </p>
              )}
            </ToolSection>
          </div>
        </>
      )}
    </ToolPanel>
  );
}
