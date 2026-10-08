import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ToolPanel, { ToolSection, FieldLabel, EmptyState, CopyField, StatGrid, StatCard } from "../ToolPanel";
import { useNexus } from "../../context/NexusContext";
import {
  getRecentApplications,
  addRecentApplication,
  clearRecentApplications,
} from "../../lib/recentApplications";
import { Search, Loader2, Bot, Clock, ExternalLink, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

function InfoRow({ label, value, mono, children }) {
  if (value == null && !children) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-[var(--nx-border)] last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--nx-text-muted)] w-36 shrink-0 pt-0.5">
        {label}
      </span>
      {children ?? (
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

function BoolBadge({ value, trueLabel = "Yes", falseLabel = "No" }) {
  if (value == null) return <span className="text-sm text-[var(--nx-text-faint)]">Unknown</span>;
  return (
    <span
      className={cn(
        "inline-flex text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
        value
          ? "bg-[var(--nx-green-soft)] text-[var(--nx-green)]"
          : "bg-[var(--nx-bg-overlay)] text-[var(--nx-text-muted)]"
      )}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function formatCount(value) {
  if (value == null) return "—";
  return value.toLocaleString();
}

function ApplicationInfoDisplay({ applicationInfo }) {
  const createdLabel = applicationInfo.createdAt
    ? new Date(applicationInfo.createdAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const hasStats =
    applicationInfo.totalGuilds != null ||
    applicationInfo.totalUsers != null ||
    applicationInfo.totalAuthorizations != null ||
    applicationInfo.verified != null;

  return (
    <div className="space-y-5">
      {hasStats && (
        <>
          <StatGrid className="grid-cols-2 sm:grid-cols-4">
            <StatCard label="Total Guilds" value={formatCount(applicationInfo.totalGuilds)} accent={applicationInfo.totalGuilds != null} />
            <StatCard label="Total Users" value={formatCount(applicationInfo.totalUsers)} accent={applicationInfo.totalUsers != null} />
            <StatCard
              label="OAuth Users"
              value={formatCount(applicationInfo.totalAuthorizations)}
              accent={applicationInfo.totalAuthorizations != null}
            />
            <StatCard
              label="Verified"
              value={applicationInfo.verified ? "Yes" : "No"}
              accent={applicationInfo.verified}
            />
          </StatGrid>
          <p className="text-[11px] text-[var(--nx-text-faint)] -mt-2">
            Guild and user counts are approximate and may be cached for up to 24 hours.
          </p>
        </>
      )}

      {applicationInfo.banner && (
        <div className="relative -mx-5 -mt-5 mb-2">
          <img
            src={applicationInfo.banner}
            alt=""
            className="w-full h-28 sm:h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--nx-bg-surface)] to-transparent" />
        </div>
      )}

      <div className={cn("flex flex-col sm:flex-row items-start gap-5", applicationInfo.banner && "relative -mt-10 px-1")}>
        {applicationInfo.icon ? (
          <img
            src={applicationInfo.icon}
            alt={applicationInfo.name}
            className={cn(
              "w-20 h-20 rounded-2xl ring-2 ring-[var(--nx-border-strong)] shadow-lg shrink-0",
              applicationInfo.banner && "ring-[var(--nx-bg-surface)]"
            )}
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl nx-logo !w-20 !h-20 !rounded-2xl !text-2xl shrink-0">
            {applicationInfo.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-[var(--nx-text-heading)]">{applicationInfo.name}</h3>
            {applicationInfo.verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--nx-accent-soft)] text-[var(--nx-accent)]">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          {applicationInfo.tag && (
            <p className="text-sm font-mono text-[var(--nx-text-muted)] mt-1">{applicationInfo.tag}</p>
          )}
          {applicationInfo.description ? (
            <p className="text-sm text-[var(--nx-text-muted)] mt-3 leading-relaxed">{applicationInfo.description}</p>
          ) : (
            <p className="text-sm text-[var(--nx-text-faint)] mt-3 italic">No description provided.</p>
          )}
          {(applicationInfo.tags?.length > 0 || applicationInfo.categories?.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {applicationInfo.categories?.map((category) => (
                <span key={category} className="nx-badge">{category}</span>
              ))}
              {applicationInfo.tags?.map((tag) => (
                <span key={tag} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--nx-bg-overlay)] text-[var(--nx-text-muted)] border border-[var(--nx-border)]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-[var(--nx-bg-input)] border border-[var(--nx-border)] px-4 py-1">
        <InfoRow label="Application ID" value={applicationInfo.id} mono />
        {applicationInfo.botUserId && <InfoRow label="Application User ID" value={applicationInfo.botUserId} mono />}
        {applicationInfo.username && <InfoRow label="Username" value={applicationInfo.username} mono />}
        {createdLabel && <InfoRow label="Created" value={createdLabel} />}
        {applicationInfo.discoverable != null && (
          <InfoRow label="Discoverable">
            <BoolBadge value={applicationInfo.discoverable} trueLabel="Listed" falseLabel="Not listed" />
          </InfoRow>
        )}
        {applicationInfo.monetized != null && (
          <InfoRow label="Monetized">
            <BoolBadge value={applicationInfo.monetized} />
          </InfoRow>
        )}
        {applicationInfo.supportServerName && (
          <InfoRow
            label="Support Server"
            value={
              applicationInfo.supportServerMembers != null
                ? `${applicationInfo.supportServerName} (${applicationInfo.supportServerMembers.toLocaleString()} members)`
                : applicationInfo.supportServerName
            }
          />
        )}
        <InfoRow label="Public Application">
          <BoolBadge value={applicationInfo.botPublic} trueLabel="Public" falseLabel="Private" />
        </InfoRow>
        <InfoRow label="Code Grant">
          <BoolBadge value={applicationInfo.requireCodeGrant} trueLabel="Required" falseLabel="Not required" />
        </InfoRow>
        {applicationInfo.accentColor && (
          <InfoRow label="Accent">
            <span className="inline-flex items-center gap-2 text-sm">
              <span
                className="w-4 h-4 rounded-full ring-1 ring-[var(--nx-border-strong)] shrink-0"
                style={{ backgroundColor: applicationInfo.accentColor }}
              />
              <span className="font-mono text-[var(--nx-accent)]">{applicationInfo.accentColor}</span>
            </span>
          </InfoRow>
        )}
        {applicationInfo.badges?.length > 0 && (
          <InfoRow label="Badges">
            <div className="flex flex-wrap gap-1.5">
              {applicationInfo.badges.map((badge) => (
                <span key={badge} className="nx-badge">{badge}</span>
              ))}
            </div>
          </InfoRow>
        )}
      </div>

      <CopyField value={applicationInfo.inviteUrl} label="Invite Link" />

      <div className="flex flex-wrap gap-2">
        <a
          href={applicationInfo.developerPortalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--nx-bg-overlay)] hover:bg-[var(--nx-bg-raised)] border border-[var(--nx-border)] text-sm font-medium text-[var(--nx-text)] transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Developer Portal
        </a>
        {applicationInfo.termsOfServiceUrl && (
          <a
            href={applicationInfo.termsOfServiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--nx-bg-overlay)] hover:bg-[var(--nx-bg-raised)] border border-[var(--nx-border)] text-sm font-medium text-[var(--nx-text)] transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Terms of Service
          </a>
        )}
        {applicationInfo.privacyPolicyUrl && (
          <a
            href={applicationInfo.privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--nx-bg-overlay)] hover:bg-[var(--nx-bg-raised)] border border-[var(--nx-border)] text-sm font-medium text-[var(--nx-text)] transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Privacy Policy
          </a>
        )}
      </div>
    </div>
  );
}

export default function ApplicationLookupTool() {
  const { setClientId, applicationInfo, setApplicationInfo } = useNexus();
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentApplications, setRecentApplications] = useState([]);

  useEffect(() => {
    setRecentApplications(getRecentApplications());
  }, []);

  const fetchApplicationInfo = async (id = searchId.trim()) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/application-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setApplicationInfo(data);
      // Only sync to OAuth/invite tools when the user searched by application ID
      if (id === data.id) {
        setClientId(data.id);
      }
      addRecentApplication(data);
      setRecentApplications(getRecentApplications());
    } catch (err) {
      setError(err.message || "Could not fetch application info.");
      setApplicationInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const selectRecentApplication = (application) => {
    setSearchId(application.id);
    setClientId(application.id);
    setApplicationInfo(application);
    setError("");
    fetchApplicationInfo(application.id);
  };

  const handleClearRecent = () => {
    clearRecentApplications();
    setRecentApplications([]);
  };

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:h-full lg:min-h-0">
        <ToolSection title="Search">
          <FieldLabel hint="Application or application user ID">Client / Application ID</FieldLabel>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={searchId}
              onChange={(e) => { setSearchId(e.target.value); setApplicationInfo(null); setError(""); }}
              placeholder="Snowflake ID"
              className="font-mono flex-1 min-w-0"
              onKeyDown={(e) => e.key === "Enter" && fetchApplicationInfo()}
            />
            <Button onClick={() => fetchApplicationInfo()} disabled={loading || !searchId.trim()} className="shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Fetch
            </Button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-[var(--nx-red)] bg-[var(--nx-red-soft)] border border-[var(--nx-red)]/20 rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          {recentApplications.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--nx-text-muted)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Recent Applications
                </p>
                <button
                  type="button"
                  onClick={handleClearRecent}
                  className="text-[11px] font-semibold text-[var(--nx-text-faint)] hover:text-[var(--nx-text-muted)] transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {recentApplications.map((application) => (
                  <button
                    key={application.id}
                    type="button"
                    onClick={() => selectRecentApplication(application)}
                    disabled={loading}
                    className={cn(
                      "w-full nx-selectable flex items-center gap-3 p-3 text-left transition-all",
                      applicationInfo?.id === application.id && "nx-selectable-active"
                    )}
                  >
                    {application.icon ? (
                      <img
                        src={application.icon}
                        alt={application.name}
                        className="w-10 h-10 rounded-xl ring-1 ring-[var(--nx-border-strong)] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl nx-logo !w-10 !h-10 !rounded-xl !text-sm shrink-0">
                        {application.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--nx-text-heading)] truncate">{application.name}</p>
                      <p className="text-xs font-mono text-[var(--nx-text-muted)] truncate">{application.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 rounded-xl bg-[var(--nx-bg-input)] border border-[var(--nx-border)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--nx-text-muted)] mb-3">Quick tips</p>
            <ul className="text-sm text-[var(--nx-text-muted)] space-y-2">
              <li className="flex gap-2"><span className="text-[var(--nx-accent)]">→</span> Find your Client ID in the Discord Developer Portal</li>
              <li className="flex gap-2"><span className="text-[var(--nx-accent)]">→</span> Application IDs sync to OAuth after lookup; application user IDs stay local</li>
              <li className="flex gap-2"><span className="text-[var(--nx-accent)]">→</span> Recently looked-up applications appear above for quick access</li>
            </ul>
          </div>
        </ToolSection>

        <ToolSection title="Application Info" fill className="min-h-[280px]">
          {loading && !applicationInfo ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-[var(--nx-text-muted)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--nx-accent)]" />
              <p className="text-sm">Fetching application details…</p>
            </div>
          ) : applicationInfo ? (
            <div className="relative">
              {loading && (
                <div className="absolute top-0 right-0 z-10">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--nx-accent)]" />
                </div>
              )}
              <ApplicationInfoDisplay applicationInfo={applicationInfo} />
            </div>
          ) : (
            <EmptyState
              icon={Bot}
              title="No application loaded"
              description="Enter an application or application user ID and click Fetch to view application details."
            />
          )}
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
