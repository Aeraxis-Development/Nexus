import { useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
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
import { inviteUrl, parseInviteCode } from "../../lib/invites";
import { cn } from "@/lib/utils";

function InfoRow({ label, value, mono }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-[var(--nx-border)] last:border-0">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nx-text-faint)] w-36 shrink-0 pt-0.5">
        {label}
      </span>
      <span
        className={cn(
          "text-sm text-[var(--nx-text-heading)] break-all",
          mono && "font-mono text-[var(--nx-accent)]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function formatExpiry(iso) {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function InviteTool() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const lookup = async (e) => {
    e?.preventDefault();
    const code = parseInviteCode(input);
    if (!code) {
      setError("Enter a valid invite code or discord.gg link.");
      setData(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invite-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite: input }),
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

  return (
    <ToolPanel fill>
      <ToolSection title="Lookup" description="Resolve a public invite code — no token required">
        <form onSubmit={lookup}>
          <FieldLabel hint="Code or full URL">Invite</FieldLabel>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="discord.gg/…"
              className="font-mono text-sm flex-1 min-w-0"
            />
            <Button type="submit" disabled={loading || !input.trim()} className="shrink-0 w-full sm:w-auto">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Lookup
            </Button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-[var(--nx-red)]">{error}</p>}
      </ToolSection>

      {!data && !error && (
        <EmptyState
          icon={Search}
          title="Resolve an invite"
          description="Paste a discord.gg link or vanity code to see guild, channel, and expiry details."
        />
      )}

      {data && (
        <>
          <StatGrid>
            <StatCard
              label="Members"
              value={data.approximateMemberCount?.toLocaleString?.() ?? "—"}
              accent
            />
            <StatCard
              label="Online"
              value={data.approximatePresenceCount?.toLocaleString?.() ?? "—"}
            />
            <StatCard label="Expires" value={data.expiresAt ? "Yes" : "Never"} />
            <StatCard label="Temporary" value={data.temporary ? "Yes" : "No"} />
          </StatGrid>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            <ToolSection
              title="Invite"
              action={
                data.url ? (
                  <a
                    href={data.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--nx-accent)] hover:underline"
                  >
                    Open <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null
              }
            >
              <div className="flex items-center gap-3 mb-4">
                {data.guild?.icon && (
                  <img
                    src={data.guild.icon}
                    alt=""
                    className="w-14 h-14 rounded-2xl border border-[var(--nx-border)]"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-lg font-bold text-[var(--nx-text-heading)] truncate">
                    {data.guild?.name || "Unknown guild"}
                  </p>
                  {data.guild?.description && (
                    <p className="text-xs text-[var(--nx-text-muted)] mt-1 line-clamp-2">
                      {data.guild.description}
                    </p>
                  )}
                </div>
              </div>

              <CopyField label="Invite URL" value={data.url || inviteUrl(data.code)} />
              <div className="mt-3">
                <CopyField label="Code" value={data.code} />
              </div>

              <div className="mt-4 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-4">
                <InfoRow label="Expires" value={formatExpiry(data.expiresAt)} />
                <InfoRow label="Max uses" value={data.maxUses === 0 ? "Unlimited" : data.maxUses} />
                <InfoRow label="Uses" value={data.uses} />
                <InfoRow
                  label="Max age"
                  value={
                    data.maxAge == null
                      ? null
                      : data.maxAge === 0
                        ? "Forever"
                        : `${Math.round(data.maxAge / 3600)}h`
                  }
                />
                <InfoRow label="Channel" value={data.channel ? `#${data.channel.name}` : null} />
                <InfoRow label="Channel ID" value={data.channel?.id} mono />
              </div>
            </ToolSection>

            <ToolSection title="Guild & inviter">
              <div className="rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-4 mb-4">
                <InfoRow label="Guild ID" value={data.guild?.id} mono />
                <InfoRow label="Vanity" value={data.guild?.vanityUrlCode} mono />
                <InfoRow
                  label="Boosts"
                  value={data.guild?.premiumSubscriptionCount}
                />
                <InfoRow
                  label="Features"
                  value={
                    data.guild?.features?.length
                      ? `${data.guild.features.length} flags`
                      : null
                  }
                />
              </div>

              {data.guild?.features?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {data.guild.features.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] font-mono px-2 py-1 rounded-md bg-[var(--nx-bg-overlay)] border border-[var(--nx-border)] text-[var(--nx-text-muted)]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {data.inviter && (
                <div className="flex items-center gap-3 rounded-xl border border-[var(--nx-border)] p-3">
                  {data.inviter.avatar && (
                    <img
                      src={data.inviter.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--nx-text-heading)]">
                      {data.inviter.globalName || data.inviter.username}
                      {data.inviter.bot && (
                        <span className="ml-2 text-[10px] uppercase font-bold text-[var(--nx-accent)]">
                          Bot
                        </span>
                      )}
                    </p>
                    <p className="text-xs font-mono text-[var(--nx-text-faint)]">
                      @{data.inviter.username} · {data.inviter.id}
                    </p>
                  </div>
                </div>
              )}

              {data.targetApplication && (
                <div className="mt-3 rounded-xl border border-[var(--nx-border)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--nx-text-faint)] mb-2">
                    Target application
                  </p>
                  <div className="flex items-center gap-3">
                    {data.targetApplication.icon && (
                      <img
                        src={data.targetApplication.icon}
                        alt=""
                        className="w-10 h-10 rounded-xl"
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{data.targetApplication.name}</p>
                      <p className="text-xs font-mono text-[var(--nx-text-faint)]">
                        {data.targetApplication.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </ToolSection>
          </div>
        </>
      )}
    </ToolPanel>
  );
}
