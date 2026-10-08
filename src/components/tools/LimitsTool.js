import { useMemo, useState } from "react";
import { AlertTriangle, Check, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import ToolPanel, {
  ToolSection,
  FieldLabel,
  StatGrid,
  StatCard,
} from "../ToolPanel";
import {
  EXAMPLE_MESSAGE,
  LIMIT_REFERENCE,
  analyzePayload,
} from "../../lib/limits";
import { cn } from "@/lib/utils";

function Meter({ check }) {
  const tone = check.over
    ? "bg-[var(--nx-red)]"
    : check.pct >= 90
      ? "bg-[#f0b232]"
      : "bg-[var(--nx-accent)]";

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        check.over
          ? "border-[var(--nx-red)]/40 bg-[var(--nx-red-soft)]"
          : check.pct >= 90
            ? "border-[#f0b232]/35 bg-[#f0b232]/10"
            : "border-[var(--nx-border)] bg-[var(--nx-bg-input)]"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="min-w-0">
          <p className="text-xs font-mono font-semibold text-[var(--nx-text-heading)] truncate">
            {check.path}
          </p>
          {check.note && (
            <p className="text-[11px] text-[var(--nx-text-faint)] mt-0.5">{check.note}</p>
          )}
        </div>
        <p
          className={cn(
            "text-xs font-mono shrink-0",
            check.over ? "text-[var(--nx-red)]" : "text-[var(--nx-text-muted)]"
          )}
        >
          {check.current}/{check.max}
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--nx-bg-overlay)] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${Math.min(100, check.pct)}%` }}
        />
      </div>
    </div>
  );
}

export default function LimitsTool() {
  const [json, setJson] = useState(EXAMPLE_MESSAGE);
  const [filter, setFilter] = useState("all");

  const result = useMemo(() => analyzePayload(json), [json]);

  const visibleChecks = useMemo(() => {
    if (!result?.checks) return [];
    if (filter === "over") return result.checks.filter((c) => c.over);
    if (filter === "warn") return result.checks.filter((c) => !c.over && c.pct >= 90);
    if (filter === "used") return result.checks.filter((c) => c.current > 0);
    return result.checks;
  }, [result, filter]);

  return (
    <ToolPanel fill>
      <StatGrid>
        <StatCard
          label="Status"
          value={result.error ? "Invalid" : result.ok ? "OK" : "Over limit"}
          accent={!result.error && result.ok}
        />
        <StatCard label="Violations" value={result.error ? "—" : result.overCount ?? 0} />
        <StatCard label="Near limit" value={result.error ? "—" : result.warnCount ?? 0} />
        <StatCard label="Kind" value={result.error ? "—" : result.kind || "—"} />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection
          title="Payload"
          description="Paste message, embed, slash command, or interaction JSON"
          action={
            <Button size="sm" variant="secondary" onClick={() => setJson(EXAMPLE_MESSAGE)}>
              <RotateCcw className="w-3.5 h-3.5" /> Example
            </Button>
          }
        >
          <FieldLabel>JSON</FieldLabel>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            spellCheck={false}
            placeholder="Paste JSON"
            className="nx-input font-mono text-[11px] sm:text-xs min-h-[320px] sm:min-h-[420px] py-3 resize-y w-full leading-relaxed"
          />
          {result.error && (
            <p className="mt-3 text-sm text-[var(--nx-red)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {result.error}
            </p>
          )}
        </ToolSection>

        <ToolSection
          title="Analysis"
          description="Live check against Discord hard limits"
          action={
            !result.error && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md",
                  result.ok
                    ? "bg-[var(--nx-green-soft)] text-[var(--nx-green)]"
                    : "bg-[var(--nx-red-soft)] text-[var(--nx-red)]"
                )}
              >
                {result.ok ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {result.ok ? "Within limits" : `${result.overCount} over`}
              </span>
            )
          }
        >
          {!result.error && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { id: "all", label: "All" },
                { id: "used", label: "Used" },
                { id: "warn", label: "Near" },
                { id: "over", label: "Over" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors",
                    filter === f.id
                      ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)] text-[var(--nx-text-heading)]"
                      : "border-[var(--nx-border)] text-[var(--nx-text-muted)] hover:bg-[var(--nx-hover-bg)]"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2 max-h-[480px] overflow-y-auto scrollbar-visible pr-1">
            {result.error && (
              <p className="text-sm text-[var(--nx-text-faint)]">Fix JSON to see limit analysis.</p>
            )}
            {!result.error && visibleChecks.length === 0 && (
              <p className="text-sm text-[var(--nx-text-faint)]">No checks match this filter.</p>
            )}
            {!result.error &&
              visibleChecks.map((check) => <Meter key={check.path} check={check} />)}
          </div>
        </ToolSection>
      </div>

      <ToolSection title="Reference" description="Common Discord hard limits">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {LIMIT_REFERENCE.map((group) => (
            <div key={group.group}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--nx-text-muted)] mb-2">
                {group.group}
              </h4>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-[var(--nx-text)]">{item.label}</span>
                    <span className="font-mono text-[var(--nx-accent)]">{item.max}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ToolSection>
    </ToolPanel>
  );
}
