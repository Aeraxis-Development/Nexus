import { useMemo, useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import ToolPanel, {
  ToolSection,
  FieldLabel,
  StatGrid,
  StatCard,
} from "../ToolPanel";
import {
  EXAMPLE_PAYLOADS,
  EXPORT_TARGETS,
  exportCode,
  kindLabel,
} from "../../lib/codeExport";
import { cn } from "@/lib/utils";

function SourceBlock({ value, label, language }) {
  const [copied, setCopied] = useState(false);
  const display = value || "";

  const copy = () => {
    if (!display) return;
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="nx-card overflow-hidden flex flex-col">
      <div className="nx-section-header flex items-start sm:items-center justify-between gap-2 sm:gap-3 shrink-0">
        <div className="min-w-0">
          <h3 className="text-[11px] sm:text-xs font-bold text-[var(--nx-text-heading)] uppercase tracking-[0.08em]">
            {label}
          </h3>
          <p className="text-[11px] sm:text-xs text-[var(--nx-text-muted)] mt-0.5">
            {language}
            {display ? ` · ${display.split("\n").length} lines` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          disabled={!display}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 h-8 px-2.5 sm:px-3 text-xs rounded-lg font-semibold transition-all shrink-0",
            copied
              ? "bg-[var(--nx-green-soft)] text-[var(--nx-green)] border border-[var(--nx-green)]/30"
              : "bg-[var(--nx-accent)] hover:bg-[var(--nx-accent-hover)] text-white disabled:opacity-40"
          )}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="p-3.5 sm:p-5 pt-0 flex-1 min-h-0 flex flex-col">
        <div className="rounded-lg border border-[var(--nx-border)] bg-[#0d1117] overflow-hidden flex-1 min-h-[220px] max-h-[480px] flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--nx-border)] bg-[var(--nx-bg-overlay)] shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 text-[10px] font-mono text-[var(--nx-text-faint)]">
              {language === "discord.js" ? "export.js" : "export.py"}
            </span>
          </div>
          <pre className="flex-1 overflow-auto p-3 sm:p-4 text-[11px] sm:text-[12px] leading-relaxed font-mono scrollbar-visible m-0 text-[#e6edf3]">
            <code className="block whitespace-pre">{display || "// Paste JSON to generate code"}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

export default function CodeExportTool() {
  const [json, setJson] = useState(EXAMPLE_PAYLOADS.message);
  const [target, setTarget] = useState("djs");
  const [example, setExample] = useState("message");

  const result = useMemo(() => exportCode(json, target), [json, target]);

  const loadExample = (id) => {
    setExample(id);
    setJson(EXAMPLE_PAYLOADS[id]);
  };

  return (
    <ToolPanel fill>
      <StatGrid>
        <StatCard
          label="Detected"
          value={result.error ? "—" : kindLabel(result.kind)}
          accent={!result.error}
        />
        <StatCard
          label="Target"
          value={EXPORT_TARGETS.find((t) => t.id === target)?.label || "—"}
        />
        <StatCard
          label="Lines"
          value={result.code ? result.code.split("\n").length : "—"}
        />
        <StatCard label="Status" value={result.error ? "Invalid" : "Ready"} />
      </StatGrid>

      <div className="flex flex-wrap gap-2">
        {Object.keys(EXAMPLE_PAYLOADS).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => loadExample(id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-colors",
              example === id
                ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)] text-[var(--nx-text-heading)]"
                : "border-[var(--nx-border)] text-[var(--nx-text-muted)] hover:bg-[var(--nx-hover-bg)]"
            )}
          >
            {id}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection
          title="JSON"
          description="Paste output from Embed, Components, Slash, Interactions, or Webhook"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => loadExample(example)}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          }
        >
          <FieldLabel>Payload</FieldLabel>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            spellCheck={false}
            placeholder="Paste JSON"
            className="nx-input font-mono text-[11px] sm:text-xs min-h-[320px] sm:min-h-[420px] py-3 resize-y w-full leading-relaxed"
          />
          {result.error && (
            <p className="mt-3 text-sm text-[var(--nx-red)]">{result.error}</p>
          )}
        </ToolSection>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-wrap gap-2">
            {EXPORT_TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTarget(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                  target === t.id
                    ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)] text-[var(--nx-text-heading)]"
                    : "border-[var(--nx-border)] text-[var(--nx-text-muted)] hover:bg-[var(--nx-hover-bg)]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <SourceBlock
            value={result.code || ""}
            label="Generated code"
            language={EXPORT_TARGETS.find((t) => t.id === target)?.label || "code"}
          />
        </div>
      </div>
    </ToolPanel>
  );
}
