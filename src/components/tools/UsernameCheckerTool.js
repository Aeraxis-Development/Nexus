import { useState } from "react";
import { AtSign, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
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
import { parseUsername } from "../../lib/usernames";
import { cn } from "@/lib/utils";

function AvailabilityBanner({ available, username }) {
  if (available) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-green-soft)] px-4 py-3.5">
        <CheckCircle2 className="w-5 h-5 text-[var(--nx-green)] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--nx-green)]">Available</p>
          <p className="text-xs text-[var(--nx-text-muted)] mt-0.5">
            <span className="font-mono text-[var(--nx-text-heading)]">@{username}</span> looks free to
            claim. Discord may still reserve some names for abuse prevention.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-red-soft)] px-4 py-3.5">
      <XCircle className="w-5 h-5 text-[var(--nx-red)] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--nx-red)]">Taken</p>
        <p className="text-xs text-[var(--nx-text-muted)] mt-0.5">
          <span className="font-mono text-[var(--nx-text-heading)]">@{username}</span> is already in use
          or reserved.
        </p>
      </div>
    </div>
  );
}

export default function UsernameCheckerTool() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const check = async (e) => {
    e?.preventDefault();
    const parsed = parseUsername(input);
    if (parsed.error) {
      setError(parsed.error);
      setData(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/username-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: parsed.username }),
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

  return (
    <ToolPanel fill>
      <ToolSection
        title="Check"
        description="Check Discord unique @username availability — no token required"
      >
        <form onSubmit={check}>
          <FieldLabel hint="2–32 chars · a–z, 0–9, _ and .">Username</FieldLabel>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <AtSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nx-text-faint)]" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="username"
                className="font-mono text-sm !pl-9"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
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
          icon={AtSign}
          title="Check a username"
          description="Enter a unique Discord username to see if @handle is available or already taken."
        />
      )}

      {data && (
        <>
          <AvailabilityBanner available={data.available} username={data.username} />

          <StatGrid>
            <StatCard
              label="Status"
              value={data.available ? "Available" : "Taken"}
              accent={data.available}
            />
            <StatCard label="Handle" value={data.handle} mono />
            <StatCard label="Length" value={String(data.username.length)} />
            <StatCard
              label="Result"
              value={data.taken ? "In use" : "Free"}
              accent={data.available}
            />
          </StatGrid>

          <ToolSection title="Details">
            <CopyField label="Username" value={data.username} />
            <div className="mt-3">
              <CopyField label="Handle" value={data.handle} />
            </div>
            <p
              className={cn(
                "mt-4 text-xs leading-relaxed",
                "text-[var(--nx-text-muted)]"
              )}
            >
              Usernames are case-insensitive. Consecutive periods, the word &quot;discord&quot;, and
              reserved names like everyone / here are blocked.
            </p>
          </ToolSection>
        </>
      )}
    </ToolPanel>
  );
}
