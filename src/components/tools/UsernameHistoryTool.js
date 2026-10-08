import { useState } from "react";
import { Clock, ExternalLink, History, Loader2, Search } from "lucide-react";
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

function formatWhen(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function UsernameHistoryTool() {
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
      const res = await fetch("/api/username-history", {
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

  return (
    <ToolPanel fill>
      <ToolSection
        title="Lookup"
        description="Track and look up username / display name changes Nexus has observed"
      >
        <form onSubmit={lookup}>
          <FieldLabel hint="Snowflake ID or mention">User ID</FieldLabel>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Snowflake ID"
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
          icon={History}
          title="Username history"
          description="Enter a user ID to see observed username and display name changes. History grows as Nexus looks users up and the bot sees userUpdate events."
        />
      )}

      {data && (
        <>
          <StatGrid>
            <StatCard label="Entries" value={String(data.count ?? 0)} accent />
            <StatCard
              label="Tracking"
              value={data.trackingEnabled ? "On" : "Off"}
            />
            <StatCard
              label="Username"
              value={data.user?.username ? `@${data.user.username}` : "—"}
              mono
            />
            <StatCard label="Display" value={data.user?.globalName || "—"} />
          </StatGrid>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            <ToolSection
              title="Current user"
              action={
                data.user?.profileUrl ? (
                  <a
                    href={data.user.profileUrl}
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
                {data.user?.avatar && (
                  <img
                    src={data.user.avatar}
                    alt=""
                    className="w-14 h-14 rounded-full border border-[var(--nx-border)]"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-lg font-bold text-[var(--nx-text-heading)] truncate">
                    {data.user?.displayName || "Unknown"}
                    {data.user?.bot && (
                      <span className="ml-2 text-[10px] uppercase font-bold text-[var(--nx-accent)]">
                        Bot
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-mono text-[var(--nx-text-faint)] truncate">
                    @{data.user?.username} · {data.user?.id}
                  </p>
                </div>
              </div>
              <CopyField label="User ID" value={data.user?.id} />
              <div className="mt-3">
                <CopyField label="Username" value={data.user?.username} />
              </div>
              {data.note && (
                <p className="mt-4 text-xs text-[var(--nx-text-muted)] leading-relaxed">
                  {data.note}
                </p>
              )}
            </ToolSection>

            <ToolSection title="Observed names">
              {data.history?.length ? (
                <div className="space-y-2">
                  {data.history.map((entry, index) => (
                    <div
                      key={entry.id ?? `${entry.observedAt}-${index}`}
                      className="rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-3.5 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--nx-text-heading)] truncate">
                            {entry.displayName || entry.handle || "Unknown"}
                          </p>
                          <p className="text-xs font-mono text-[var(--nx-accent)] mt-0.5 truncate">
                            {entry.handle || "—"}
                          </p>
                          {entry.globalName && entry.username && (
                            <p className="text-[11px] text-[var(--nx-text-muted)] mt-1 truncate">
                              Display: {entry.globalName}
                            </p>
                          )}
                        </div>
                        {index === 0 && (
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-[var(--nx-accent-soft)] text-[var(--nx-accent)] border border-[var(--nx-border-accent)]">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--nx-text-faint)]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatWhen(entry.observedAt)}
                        </span>
                        <span
                          className={cn(
                            "uppercase tracking-wide font-semibold",
                            "text-[var(--nx-text-muted)]"
                          )}
                        >
                          {entry.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--nx-text-muted)]">
                  No history stored for this user yet.
                </p>
              )}
            </ToolSection>
          </div>
        </>
      )}
    </ToolPanel>
  );
}
