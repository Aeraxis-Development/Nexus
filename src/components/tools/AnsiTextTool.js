import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CheckboxIndicator } from "../ui/checkbox";
import ToolPanel, { ToolSection, FieldLabel, CopyField, CopyCodeBlock } from "../ToolPanel";
import {
  ANSI_BG,
  ANSI_COLORS,
  buildAnsiSegment,
  previewAnsiSegments,
  wrapAnsiCodeBlock,
} from "../../lib/ansiText";
import { cn } from "@/lib/utils";

export default function AnsiTextTool() {
  const [text, setText] = useState("Hello from Nexus");
  const [color, setColor] = useState(31);
  const [bg, setBg] = useState(null);
  const [bold, setBold] = useState(true);
  const [underline, setUnderline] = useState(false);
  const [lines, setLines] = useState([]);

  const currentSegment = useMemo(
    () => ({ text: text || " ", color, bg, bold, underline }),
    [text, color, bg, bold, underline]
  );

  const body = useMemo(() => {
    const segs = lines.length ? lines : [currentSegment];
    return segs.map((s) => buildAnsiSegment(s)).join("\n");
  }, [lines, currentSegment]);

  const codeBlock = useMemo(() => wrapAnsiCodeBlock(body), [body]);

  const preview = useMemo(() => {
    const segs = lines.length ? lines : [currentSegment];
    return previewAnsiSegments(segs);
  }, [lines, currentSegment]);

  const addLine = () => {
    setLines((prev) => [...prev, { ...currentSegment }]);
    setText("");
  };

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection title="Style" description="Discord ANSI colors for ```ansi code blocks">
          <FieldLabel>Text</FieldLabel>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Text" className="mb-4" maxLength={200} />

          <FieldLabel>Foreground</FieldLabel>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {ANSI_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.code)}
                className={cn(
                  "h-9 rounded-lg border text-[10px] font-semibold",
                  color === c.code ? "ring-2 ring-[var(--nx-accent)] border-transparent" : "border-[var(--nx-border)]"
                )}
                style={{ backgroundColor: c.css, color: c.id === "yellow" || c.id === "white" ? "#111" : "#fff" }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <FieldLabel>Background</FieldLabel>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
            {ANSI_BG.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBg(b.code)}
                className={cn(
                  "h-9 rounded-lg border text-[10px] font-semibold px-1",
                  bg === b.code ? "ring-2 ring-[var(--nx-accent)] border-transparent" : "border-[var(--nx-border)]"
                )}
                style={{
                  backgroundColor: b.css === "transparent" ? "var(--nx-bg-input)" : b.css,
                  color: "#fff",
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <button type="button" onClick={() => setBold((v) => !v)} className="flex items-center gap-2 text-sm">
              <CheckboxIndicator checked={bold} />
              Bold
            </button>
            <button type="button" onClick={() => setUnderline((v) => !v)} className="flex items-center gap-2 text-sm">
              <CheckboxIndicator checked={underline} />
              Underline
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={addLine} disabled={!text.trim()}>
              Add line
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setLines([])}>
              Clear lines
            </Button>
          </div>
          {lines.length > 0 && (
            <p className="mt-2 text-xs text-[var(--nx-text-faint)]">{lines.length} stacked line(s)</p>
          )}
        </ToolSection>

        <ToolSection title="Output" description="Paste into Discord as an ansi code block" fill>
          <div className="rounded-xl border border-[var(--nx-border)] bg-[#2f3136] p-4 mb-4 font-mono text-sm min-h-[120px]">
            {preview.map((seg, i) => (
              <div key={i} style={seg.style} className="whitespace-pre-wrap break-words">
                {seg.text}
              </div>
            ))}
          </div>

          <CopyField label="Code block" value={codeBlock} />
          <div className="mt-4">
            <CopyCodeBlock value={codeBlock} label="Raw" description="Includes ```ansi fence" />
          </div>
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
