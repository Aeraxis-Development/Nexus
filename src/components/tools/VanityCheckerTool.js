import { useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, Search, XCircle } from "lucide-react";
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
import { inspectVanityInput, vanityUrl } from "../../lib/vanity";
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

function AvailabilityBanner({ status, isVanity, code }) {
  if (status === "taken") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-red-soft)] px-4 py-3.5">
        <XCircle className="w-5 h-5 text-[var(--nx-red)] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--nx-red)]">Taken</p>
          <p className="text-xs text-[var(--nx-text-muted)] mt-0.5">
            {isVanity
              ? "This code is claimed as a guild vanity URL."
              : "An invite with this code exists (may be a standard invite, not a vanity)."}
          </p>
        </div>
      </div>
    );
  }

  if (status === "reserved") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-red-soft)] px-4 py-3.5">
        <XCircle className="w-5 h-5 text-[var(--nx-red)] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--nx-red)]">Reserved</p>
          <p className="text-xs text-[var(--nx-text-muted)] mt-0.5">
            Discord blocks{" "}
            <span className="font-mono text-[var(--nx-text-heading)]">discord.gg/{code}</span> even
            though no server invite is using it. Saving it under Custom Invite Link fails with
            “invalid characters, too short, or already taken.”
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--nx-border)] bg-[color-mix(in_srgb,var(--nx-yellow)_14%,transparent)] px-4 py-3.5">
      <AlertTriangle className="w-5 h-5 text-[var(--nx-yellow)] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--nx-yellow)]">No public invite</p>
        <p className="text-xs text-[var(--nx-text-muted)] mt-0.5">
          <span className="font-mono text-[var(--nx-text-heading)]">discord.gg/{code}</span> does not
          resolve. Discord can still reject the save: reserved words, blocked terms, and codes held
          for 30 days after a server loses Boost Level 3 or is removed all show up this way. That
          error is “invalid characters, too short, or already taken.” A code Discord accepts still
          needs Boost Level 3.
        </p>
      </div>
    </div>
  );
}

export default function VanityCheckerTool() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const check = async (e) => {
    e?.preventDefault();
    const parsed = inspectVanityInput(input);
    if (parsed.error) {
      setError(parsed.error);
      setData(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vanity-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vanity: input }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Check failed.");
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

  const invite = data?.invite;

  return (
    <ToolPanel fill>
      <ToolSection
        title="Check"
        description="See if a discord.gg slug is already in use — no token required"
      >
        <form onSubmit={check}>
          <FieldLabel hint="2–25 letters, numbers, or dashes">Vanity</FieldLabel>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--nx-text-faint)]">
                discord.gg/
              </span>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="vanity"
                className="font-mono text-sm !pl-[5.75rem]"
              />
            </div>
            <Button type="submit" disabled={loading || !input.trim()} className="shrink-0 w-full sm:w-auto">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Check
            </Button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-[var(--nx-red)]">{error}</p>}
      </ToolSection>

      {!data && !error && (
        <EmptyState
          icon={Search}
          title="Check a vanity URL"
          description="Enter a custom invite slug. A missing invite can still be reserved or on hold, so Discord may reject it when you save."
        />
      )}

      {data && (
        <>
          <AvailabilityBanner status={data.status} isVanity={data.isVanity} code={data.code} />

          <StatGrid>
            <StatCard
              label="Status"
              value={
                data.status === "taken" ? "Taken" : data.status === "reserved" ? "Reserved" : "No invite"
              }
            />
            <StatCard label="Type" value={data.status === "taken" ? (data.isVanity ? "Vanity" : "Invite") : "—"} />
            <StatCard
              label="Members"
              value={invite?.approximateMemberCount?.toLocaleString?.() ?? "—"}
            />
            <StatCard
              label="Online"
              value={invite?.approximatePresenceCount?.toLocaleString?.() ?? "—"}
            />
          </StatGrid>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            <ToolSection
              title="URL"
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
              <CopyField label="Invite URL" value={data.url || vanityUrl(data.code)} />
              <div className="mt-3">
                <CopyField label="Code" value={data.code} />
              </div>
            </ToolSection>

            {invite?.guild && (
              <ToolSection title="Claimed by">
                <div className="flex items-center gap-3 mb-4">
                  {invite.guild.icon && (
                    <img
                      src={invite.guild.icon}
                      alt=""
                      className="w-14 h-14 rounded-2xl border border-[var(--nx-border)]"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-[var(--nx-text-heading)] truncate">
                      {invite.guild.name || "Unknown guild"}
                    </p>
                    {invite.guild.description && (
                      <p className="text-xs text-[var(--nx-text-muted)] mt-1 line-clamp-2">
                        {invite.guild.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-4">
                  <InfoRow label="Guild ID" value={invite.guild.id} mono />
                  <InfoRow label="Vanity" value={invite.guild.vanityUrlCode} mono />
                  <InfoRow label="Boosts" value={invite.guild.premiumSubscriptionCount} />
                  <InfoRow
                    label="Channel"
                    value={invite.channel ? `#${invite.channel.name}` : null}
                  />
                </div>
              </ToolSection>
            )}
          </div>
        </>
      )}
    </ToolPanel>
  );
}
