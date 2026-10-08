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
import { parseTemplateCode, templateUrl } from "../../lib/templates";
import { cn } from "@/lib/utils";

function InfoRow({ label, value, mono }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-[var(--nx-border)] last:border-0">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nx-text-faint)] w-36 shrink-0 pt-0.5">
        {label}
      </span>
      <span className={cn("text-sm text-[var(--nx-text-heading)] break-all", mono && "font-mono text-[var(--nx-accent)]")}>
        {value}
      </span>
    </div>
  );
}

export default function TemplateTool() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const lookup = async (e) => {
    e?.preventDefault();
    if (!parseTemplateCode(input)) {
      setError("Enter a valid template code or discord.new link.");
      setData(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/template-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: input }),
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
      <ToolSection title="Lookup" description="Resolve a public guild template — no token required">
        <form onSubmit={lookup} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 min-w-0">
            <FieldLabel hint="Code or discord.new / discord.com/template URL">Template</FieldLabel>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="discord.new/…"
              className="font-mono text-sm"
            />
          </div>
          <div className="sm:pt-[22px]">
            <Button type="submit" disabled={loading || !input.trim()} className="w-full sm:w-auto">
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
          title="Resolve a template"
          description="Paste a discord.new link to inspect roles, channels, and template metadata."
        />
      )}

      {data && (
        <>
          <StatGrid>
            <StatCard label="Uses" value={data.usageCount?.toLocaleString?.() ?? "—"} accent />
            <StatCard label="Roles" value={data.guild?.roles ?? "—"} />
            <StatCard label="Channels" value={data.guild?.channels ?? "—"} />
            <StatCard label="Dirty" value={data.isDirty ? "Yes" : "No"} />
          </StatGrid>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            <ToolSection
              title="Template"
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
              <p className="text-lg font-bold text-[var(--nx-text-heading)] mb-1">{data.name}</p>
              {data.description && (
                <p className="text-sm text-[var(--nx-text-muted)] mb-4">{data.description}</p>
              )}
              <CopyField label="Template URL" value={data.url || templateUrl(data.code)} />
              <div className="mt-3">
                <CopyField label="Code" value={data.code} />
              </div>
              <div className="mt-4 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-4">
                <InfoRow label="Created" value={data.createdAt && new Date(data.createdAt).toLocaleString()} />
                <InfoRow label="Updated" value={data.updatedAt && new Date(data.updatedAt).toLocaleString()} />
                <InfoRow label="Source guild" value={data.sourceGuildId} mono />
                <InfoRow label="Creator" value={data.creator?.username ? `@${data.creator.username}` : data.creatorId} />
              </div>
            </ToolSection>

            <ToolSection title="Serialized guild">
              <div className="rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] px-4 mb-4">
                <InfoRow label="Name" value={data.guild?.name} />
                <InfoRow label="Locale" value={data.guild?.preferredLocale} />
                <InfoRow label="Verification" value={data.guild?.verificationLevel} />
                <InfoRow label="AFK timeout" value={data.guild?.afkTimeout != null ? `${data.guild.afkTimeout}s` : null} />
              </div>

              {data.guild?.channelList?.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--nx-text-faint)] mb-2">
                    Channels
                  </p>
                  <div className="max-h-40 overflow-y-auto scrollbar-visible space-y-1">
                    {data.guild.channelList.map((c) => (
                      <div key={c.id} className="text-xs font-mono px-2 py-1 rounded bg-[var(--nx-bg-overlay)] border border-[var(--nx-border)]">
                        {c.name} <span className="text-[var(--nx-text-faint)]">· type {c.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.guild?.roleList?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--nx-text-faint)] mb-2">
                    Roles
                  </p>
                  <div className="max-h-40 overflow-y-auto scrollbar-visible space-y-1">
                    {data.guild.roleList.map((r) => (
                      <div key={r.id} className="text-xs px-2 py-1 rounded bg-[var(--nx-bg-overlay)] border border-[var(--nx-border)]">
                        <span className="font-semibold">{r.name}</span>
                        <span className="font-mono text-[10px] text-[var(--nx-text-faint)] ml-2">{r.id}</span>
                      </div>
                    ))}
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
