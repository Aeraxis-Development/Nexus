import { useMemo, useState } from "react";
import { EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import ToolPanel, { ToolSection, FieldLabel, CopyField, CopyCodeBlock } from "../ToolPanel";

function toSpoiler(text, mode) {
  const raw = String(text ?? "");
  if (!raw.trim()) return "";

  if (mode === "chars") {
    return raw
      .split("")
      .map((ch) => (ch === " " || ch === "\n" ? ch : `||${ch}||`))
      .join("");
  }

  if (mode === "words") {
    return raw
      .split(/(\s+)/)
      .map((part) => (/^\s+$/.test(part) ? part : part ? `||${part}||` : part))
      .join("");
  }

  // lines
  if (mode === "lines") {
    return raw
      .split("\n")
      .map((line) => (line.trim() ? `||${line}||` : line))
      .join("\n");
  }

  // whole
  return `||${raw}||`;
}

const MODES = [
  { id: "whole", label: "Whole block", hint: "||text||" },
  { id: "lines", label: "Per line", hint: "Each line wrapped" },
  { id: "words", label: "Per word", hint: "Each word wrapped" },
  { id: "chars", label: "Per character", hint: "Each char (meme mode)" },
];

export default function SpoilerTool() {
  const [text, setText] = useState("secret lore goes here");
  const [mode, setMode] = useState("whole");

  const output = useMemo(() => toSpoiler(text, mode), [text, mode]);

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection title="Input" description="Wrap text in Discord spoiler markup">
          <FieldLabel>Mode</FieldLabel>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={
                  mode === m.id
                    ? "nx-selectable nx-selectable-active py-2 px-3 text-left"
                    : "nx-selectable py-2 px-3 text-left"
                }
              >
                <span className="block text-xs font-semibold text-[var(--nx-text-heading)]">{m.label}</span>
                <span className="block text-[10px] text-[var(--nx-text-faint)] font-mono mt-0.5">{m.hint}</span>
              </button>
            ))}
          </div>

          <FieldLabel hint="Paste message content to spoilerize">Text</FieldLabel>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="nx-input !h-auto py-3 font-mono text-sm w-full resize-y min-h-[160px]"
            placeholder="Text to hide"
          />

          <div className="flex flex-wrap gap-2 mt-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => setText("")}>
              Clear
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setText("||already spoiled|| stays fine")}
            >
              Sample
            </Button>
          </div>
        </ToolSection>

        <ToolSection title="Output" description="Copy-ready Discord formatting" fill>
          <div className="mb-4 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] p-4 min-h-[100px]">
            <div className="flex items-center gap-2 mb-2 text-[var(--nx-text-faint)]">
              <EyeOff className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.08em]">Preview (revealed)</span>
            </div>
            <p className="text-sm text-[var(--nx-text)] whitespace-pre-wrap break-words">
              {text || <span className="text-[var(--nx-text-faint)]">Nothing yet</span>}
            </p>
          </div>

          <CopyField label="Spoiler text" value={output} placeholder="Spoiler" />
          <div className="mt-4">
            <CopyCodeBlock
              value={output || ""}
              label="Raw"
              description="Paste into Discord"
              emptyHint="Enter text to generate spoilers."
            />
          </div>
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
