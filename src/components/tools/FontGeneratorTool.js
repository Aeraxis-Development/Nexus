import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import ToolPanel, { ToolSection, FieldLabel, CopyField } from "../ToolPanel";
import { applyAllFontStyles } from "../../lib/fancyFonts";

export default function FontGeneratorTool() {
  const [text, setText] = useState("Nexus");

  const styles = useMemo(() => applyAllFontStyles(text || " "), [text]);

  return (
    <ToolPanel fill>
      <ToolSection
        title="Text"
        description="Generate stylish Unicode fonts for Discord usernames, bios, and messages"
      >
        <FieldLabel hint="Some styles may not render in every client font">Input</FieldLabel>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Text"
          className="text-sm"
          maxLength={200}
        />
      </ToolSection>

      <ToolSection title="Styles" description={`${styles.length} Unicode variants`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {styles.map((style) => (
            <div
              key={style.id}
              className="p-3 rounded-lg bg-[var(--nx-bg-input)] border border-[var(--nx-border)]"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-[var(--nx-text-heading)]">{style.label}</span>
                <span className="text-[10px] font-mono text-[var(--nx-text-faint)]">{style.id}</span>
              </div>
              <p className="text-lg text-[var(--nx-text)] break-all mb-3 leading-snug min-h-[1.75rem]">
                {style.value || "—"}
              </p>
              <CopyField value={style.value} />
            </div>
          ))}
        </div>
      </ToolSection>
    </ToolPanel>
  );
}
