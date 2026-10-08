import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import ToolPanel, { ToolSection, FieldLabel, CopyField } from "../ToolPanel";
import {
  buildMessageLink,
  DISCORD_HOSTS,
  parseMessageLink,
} from "../../lib/messageLinks";
import { cn } from "@/lib/utils";

export default function MessageLinkTool() {
  const [guildId, setGuildId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [host, setHost] = useState("discord.com");
  const [isDm, setIsDm] = useState(false);
  const [parseInput, setParseInput] = useState("");

  const link = buildMessageLink({
    guildId: isDm ? "@me" : guildId,
    channelId,
    messageId,
    host,
  });

  const parsed = useMemo(() => parseMessageLink(parseInput), [parseInput]);

  const applyParsed = () => {
    if (!parsed) return;
    setIsDm(parsed.isDm);
    setGuildId(parsed.isDm ? "" : parsed.guildId);
    setChannelId(parsed.channelId);
    setMessageId(parsed.messageId || "");
  };

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection title="Build" description="Create a jump URL for a channel or message">
          <Checkbox
            checked={isDm}
            onCheckedChange={setIsDm}
            className="mb-4"
            label="DM / Group DM (@me)"
          />

          {!isDm && (
            <>
              <FieldLabel>Guild ID</FieldLabel>
              <Input
                value={guildId}
                onChange={(e) => setGuildId(e.target.value.replace(/\D/g, ""))}
                placeholder="Guild ID"
                className="font-mono text-sm mb-4"
              />
            </>
          )}

          <FieldLabel>Channel ID</FieldLabel>
          <Input
            value={channelId}
            onChange={(e) => setChannelId(e.target.value.replace(/\D/g, ""))}
            placeholder="Channel ID"
            className="font-mono text-sm mb-4"
          />

          <FieldLabel hint="Optional — omit for a channel-only link">Message ID</FieldLabel>
          <Input
            value={messageId}
            onChange={(e) => setMessageId(e.target.value.replace(/\D/g, ""))}
            placeholder="Message ID"
            className="font-mono text-sm mb-4"
          />

          <FieldLabel>Client host</FieldLabel>
          <div className="flex flex-wrap gap-2 mb-5">
            {DISCORD_HOSTS.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setHost(h.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                  host === h.id
                    ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)] text-[var(--nx-text-heading)]"
                    : "border-[var(--nx-border)] text-[var(--nx-text-muted)] hover:bg-[var(--nx-hover-bg)]"
                )}
              >
                {h.label}
              </button>
            ))}
          </div>

          <CopyField label="Message link" value={link} placeholder="Message link" />
        </ToolSection>

        <ToolSection title="Parse" description="Break a Discord URL into IDs">
          <FieldLabel>Message / channel URL</FieldLabel>
          <Input
            value={parseInput}
            onChange={(e) => setParseInput(e.target.value)}
            placeholder="https://…"
            className="font-mono text-xs"
          />

          <div className="mt-5 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] p-4 min-h-[200px]">
            {!parseInput.trim() && (
              <p className="text-sm text-[var(--nx-text-faint)]">Paste a discord.com/channels link.</p>
            )}
            {parseInput.trim() && !parsed && (
              <p className="text-sm text-[var(--nx-red)]">Not a valid Discord channel/message link.</p>
            )}
            {parsed && (
              <div className="space-y-3">
                <dl className="space-y-3">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--nx-text-faint)]">Guild</dt>
                    <dd className="text-sm font-mono text-[var(--nx-accent)] mt-0.5 break-all">
                      {parsed.isDm ? "@me (DM)" : parsed.guildId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--nx-text-faint)]">Channel</dt>
                    <dd className="text-sm font-mono text-[var(--nx-accent)] mt-0.5 break-all">{parsed.channelId}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--nx-text-faint)]">Message</dt>
                    <dd className="text-sm font-mono text-[var(--nx-text-heading)] mt-0.5 break-all">
                      {parsed.messageId || "—"}
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={applyParsed}
                  className="text-xs font-semibold text-[var(--nx-accent)] hover:underline"
                >
                  Load into builder
                </button>
              </div>
            )}
          </div>
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
