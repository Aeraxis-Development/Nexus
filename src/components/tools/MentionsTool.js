import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import ToolPanel, { ToolSection, FieldLabel, CopyField } from "../ToolPanel";
import { buildMention, MENTION_TYPES, parseMention } from "../../lib/mentions";
import { cn } from "@/lib/utils";

export default function MentionsTool() {
  const [typeId, setTypeId] = useState("user");
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState(false);
  const [parseInput, setParseInput] = useState("");

  const type = MENTION_TYPES.find((t) => t.id === typeId);
  const needsName = ["slash", "emoji", "animated"].includes(typeId);
  const mention = buildMention(typeId, { id, name, nickname });

  const parsed = useMemo(() => parseMention(parseInput), [parseInput]);

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection title="Build" description="Generate Discord mention markup">
          <FieldLabel>Mention type</FieldLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {MENTION_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeId(t.id)}
                className={cn(
                  "nx-selectable py-2 px-2 sm:px-3 text-center",
                  typeId === t.id && "nx-selectable-active"
                )}
              >
                <span className="text-[11px] sm:text-xs font-semibold text-[var(--nx-text-heading)]">{t.label}</span>
              </button>
            ))}
          </div>

          {!type?.noId && (
            <>
              <FieldLabel hint="17–20 digit snowflake">Snowflake ID</FieldLabel>
              <Input
                value={id}
                onChange={(e) => setId(e.target.value.replace(/\D/g, ""))}
                placeholder="Snowflake ID"
                className="font-mono text-sm mb-4"
              />
            </>
          )}

          {needsName && (
            <>
              <FieldLabel hint={typeId === "slash" ? "Command name including groups" : "Emoji name"}>
                Name
              </FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={typeId === "slash" ? "ping" : "blobcat"}
                className="mb-4"
              />
            </>
          )}

          {typeId === "user" && (
            <Checkbox
              checked={nickname}
              onCheckedChange={setNickname}
              className="mb-4"
              label={
                <>
                  Nickname form (<code className="font-mono">&lt;@!id&gt;</code>)
                </>
              }
            />
          )}

          <CopyField label="Mention" value={mention} placeholder="Mention" />
          {type?.hint && (
            <p className="mt-3 text-xs text-[var(--nx-text-faint)]">{type.hint}</p>
          )}
        </ToolSection>

        <ToolSection title="Parse" description="Paste a mention to extract its parts">
          <FieldLabel>Mention string</FieldLabel>
          <Input
            value={parseInput}
            onChange={(e) => setParseInput(e.target.value)}
            placeholder="<@user>"
            className="font-mono text-sm"
          />

          <div className="mt-5 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] p-4 min-h-[160px]">
            {!parseInput.trim() && (
              <p className="text-sm text-[var(--nx-text-faint)]">Paste a mention to decode it.</p>
            )}
            {parseInput.trim() && !parsed && (
              <p className="text-sm text-[var(--nx-red)]">Unrecognized mention format.</p>
            )}
            {parsed && (
              <dl className="space-y-3">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--nx-text-faint)]">Type</dt>
                  <dd className="text-sm font-semibold text-[var(--nx-text-heading)] mt-0.5">{parsed.type}</dd>
                </div>
                {parsed.id && (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--nx-text-faint)]">ID</dt>
                    <dd className="text-sm font-mono text-[var(--nx-accent)] mt-0.5 break-all">{parsed.id}</dd>
                  </div>
                )}
                {parsed.name && (
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--nx-text-faint)]">Name</dt>
                    <dd className="text-sm font-semibold text-[var(--nx-text-heading)] mt-0.5">{parsed.name}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
