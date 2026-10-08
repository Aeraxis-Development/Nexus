import { useRef, useState } from "react";
import ToolPanel, { ToolSection, FieldLabel, CopyField } from "../ToolPanel";
import {
  FORMAT_BUTTONS,
  renderDiscordMarkdown,
  wrapSelection,
  prefixLines,
} from "../../lib/discordMarkdown";
import { cn } from "@/lib/utils";

const EXAMPLE = `**Welcome to Nexus Markdown!**

Format messages with *italic*, __underline__, ~~strikethrough~~, and ||spoilers||.

\`inline code\` and fenced blocks:
\`\`\`
const bot = new Client({ intents: [...] });
\`\`\`

> Block quotes work too.

Mentions: <@123456789012345678> <#123456789012345678> <@&123456789012345678>
Timestamps: <t:1719000000:R>
Links: [Discord Developers](https://discord.com/developers/docs)`;

export default function MarkdownTool() {
  const textareaRef = useRef(null);
  const [text, setText] = useState(EXAMPLE);

  const applyFormat = (format) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    let result;
    if (format.prefix) {
      result = prefixLines(text, start, end, format.prefix);
    } else {
      const [before, after] = format.wrap;
      result = wrapSelection(text, start, end, before, after);
    }

    setText(result.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const previewHtml = renderDiscordMarkdown(text);
  const charCount = text.length;

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:h-full lg:min-h-0">
        <ToolSection title="Editor" fill className="lg:min-h-0">
          <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
            {FORMAT_BUTTONS.map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => applyFormat(format)}
                title={format.example}
                className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-1.5 rounded-lg bg-[var(--nx-bg-overlay)] hover:bg-[var(--nx-bg-raised)] text-[var(--nx-text)] border border-[var(--nx-border)] transition-colors font-medium"
              >
                {format.label}
              </button>
            ))}
          </div>

          <FieldLabel hint="Discord markdown subset — select text and use toolbar buttons">
            Message content
          </FieldLabel>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="nx-textarea min-h-[200px] sm:min-h-[280px] font-mono text-sm"
            placeholder="Markdown"
          />
          <p className="mt-2 text-xs text-[var(--nx-text-faint)]">{charCount} characters</p>
        </ToolSection>

        <div className="flex flex-col gap-3 sm:gap-4 lg:min-h-0">
          <ToolSection title="Live Preview" fill className="lg:min-h-0">
            <div
              className={cn(
                "rounded-md bg-[#313338] p-4 min-h-[280px] overflow-y-auto scrollbar-visible",
                "text-[#dbdee1] text-[15px] leading-[1.375] nx-discord-markdown"
              )}
              dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-[#949ba4]">Preview appears here…</p>' }}
            />
          </ToolSection>

          <CopyField value={text} label="Raw Markdown" />
        </div>
      </div>
    </ToolPanel>
  );
}
