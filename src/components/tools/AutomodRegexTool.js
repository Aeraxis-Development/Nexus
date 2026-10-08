import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CheckboxIndicator } from "../ui/checkbox";
import Dropdown from "../ui/Dropdown";
import ToolPanel, {
  ToolSection,
  FieldLabel,
  CopyField,
  StatGrid,
  StatCard,
} from "../ToolPanel";
import {
  AUTOMOD_REGEX_CATEGORIES,
  AUTOMOD_REGEX_PRESETS,
  buildCustomAutomodRegex,
  testAutomodRegex,
} from "../../lib/automodRegex";
import { cn } from "@/lib/utils";

const MODES = [
  { value: "contains", label: "Contains" },
  { value: "whole", label: "Whole word" },
  { value: "starts", label: "Starts with" },
  { value: "ends", label: "Ends with" },
  { value: "any-of", label: "Any of (OR)" },
];

export default function AutomodRegexTool() {
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState(AUTOMOD_REGEX_PRESETS[0].id);
  const [customRaw, setCustomRaw] = useState("discord.gg\nnitro free");
  const [mode, setMode] = useState("contains");
  const [caseInsensitive, setCaseInsensitive] = useState(true);
  const [sample, setSample] = useState("Join my server https://discord.gg/nexus");

  const presets = useMemo(
    () =>
      category === "all"
        ? AUTOMOD_REGEX_PRESETS
        : AUTOMOD_REGEX_PRESETS.filter((p) => p.category === category),
    [category]
  );

  const selected = AUTOMOD_REGEX_PRESETS.find((p) => p.id === selectedId) || presets[0];
  const customPattern = useMemo(
    () => buildCustomAutomodRegex(customRaw, mode, { caseInsensitive }),
    [customRaw, mode, caseInsensitive]
  );

  const activePattern = selected?.pattern || "";
  const presetTest = testAutomodRegex(activePattern, sample);
  const customTest = testAutomodRegex(customPattern, sample);

  return (
    <ToolPanel fill>
      <StatGrid>
        <StatCard label="Presets" value={String(AUTOMOD_REGEX_PRESETS.length)} />
        <StatCard label="Category" value={category} />
        <StatCard
          label="Preset match"
          value={!presetTest.ok ? "Error" : presetTest.matches ? "Yes" : "No"}
          accent={presetTest.matches}
        />
        <StatCard
          label="Custom match"
          value={!customTest.ok ? "Error" : customTest.matches ? "Yes" : "No"}
          accent={customTest.matches}
        />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection title="Presets" description="Copy-ready AutoMod regex for spam, links, and scams">
          <FieldLabel>Category</FieldLabel>
          <div className="flex flex-wrap gap-2 mb-4">
            {AUTOMOD_REGEX_CATEGORIES.filter((c) => c.id !== "custom").map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                  category === c.id
                    ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)] text-[var(--nx-text-heading)]"
                    : "border-[var(--nx-border)] text-[var(--nx-text-muted)] hover:bg-[var(--nx-hover-bg)]"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto scrollbar-visible pr-1">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-colors",
                  selectedId === p.id
                    ? "border-[var(--nx-border-accent)] bg-[var(--nx-accent-soft)]/50"
                    : "border-[var(--nx-border)] bg-[var(--nx-bg-input)] hover:bg-[var(--nx-hover-bg)]"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--nx-text-heading)]">{p.label}</span>
                  <span className="nx-badge capitalize">{p.category}</span>
                </div>
                <p className="text-xs text-[var(--nx-text-muted)] mt-1">{p.description}</p>
              </button>
            ))}
          </div>

          {selected && (
            <>
              <CopyField label={selected.label} value={selected.pattern} />
              {!presetTest.ok && (
                <p className="mt-2 text-xs text-[var(--nx-red)]">{presetTest.error}</p>
              )}
            </>
          )}
        </ToolSection>

        <ToolSection title="Custom builder" description="Turn keywords into an AutoMod regex pattern">
          <FieldLabel hint="One keyword per line (or comma-separated)">Keywords</FieldLabel>
          <textarea
            value={customRaw}
            onChange={(e) => setCustomRaw(e.target.value)}
            rows={5}
            placeholder="Keyword"
            className="nx-input !h-auto py-3 font-mono text-xs w-full resize-y mb-3"
          />

          <FieldLabel>Match mode</FieldLabel>
          <div className="mb-3">
            <Dropdown value={mode} onChange={setMode} options={MODES} />
          </div>

          <button
            type="button"
            onClick={() => setCaseInsensitive((v) => !v)}
            className="flex items-center gap-2 text-sm mb-4"
          >
            <CheckboxIndicator checked={caseInsensitive} />
            Case insensitive <span className="text-[var(--nx-text-faint)] font-mono text-xs">(?i)</span>
          </button>

          <CopyField label="Generated pattern" value={customPattern} placeholder="Pattern" />

          <div className="mt-5 pt-5 border-t border-[var(--nx-border)]">
            <FieldLabel hint="Tests against the selected preset and your custom pattern">Sample message</FieldLabel>
            <Input value={sample} onChange={(e) => setSample(e.target.value)} placeholder="Sample message" className="mb-3" />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSample("Join my server https://discord.gg/nexus")}
              >
                Invite sample
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSample("Free nitro from steam gift!!1")}
              >
                Scam sample
              </Button>
            </div>
            {customTest.error && (
              <p className="mt-2 text-xs text-[var(--nx-red)]">{customTest.error}</p>
            )}
          </div>
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
