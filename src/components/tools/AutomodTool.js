import { useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw, Upload, List, Trash } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Dropdown from "../ui/Dropdown";
import { CheckboxIndicator } from "../ui/checkbox";
import ToolPanel, {
  ToolSection,
  FieldLabel,
  CopyCodeBlock,
  StatGrid,
  StatCard,
} from "../ToolPanel";
import BotGuildPanel, { BotActionResult } from "../BotGuildPanel";
import {
  ACTION_TYPES,
  KEYWORD_PRESETS,
  TRIGGER_TYPES,
  buildAutomodRule,
  createExampleAutomod,
  emptyAction,
} from "../../lib/automod";
import { cn } from "@/lib/utils";

function ListEditor({ label, values, onChange, placeholder, max }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <FieldLabel>
          {label} ({values.length}
          {max ? `/${max}` : ""})
        </FieldLabel>
        <Button
          size="sm"
          variant="secondary"
          disabled={max && values.length >= max}
          onClick={() => onChange([...values, ""])}
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={value}
              onChange={(e) =>
                onChange(values.map((v, i) => (i === index ? e.target.value : v)))
              }
              placeholder={placeholder}
              className="font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="p-2 rounded-md text-[var(--nx-red)] hover:bg-[var(--nx-red-soft)]"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {values.length === 0 && (
          <p className="text-xs text-[var(--nx-text-faint)]">None added yet.</p>
        )}
      </div>
    </div>
  );
}

export default function AutomodTool() {
  const [state, setState] = useState(createExampleAutomod);
  const [guildId, setGuildId] = useState("");
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const [listed, setListed] = useState([]);
  const rule = useMemo(() => buildAutomodRule(state), [state]);
  const json = JSON.stringify(rule, null, 2);

  const update = (patch) => setState((prev) => ({ ...prev, ...patch }));

  const deploy = async ({ botReady }) => {
    if (!botReady) return;
    setBusy("deploy");
    setResult(null);
    try {
      const res = await fetch("/api/automod-rules", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, payload: rule }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          ok: false,
          msg: data.error || "Failed to create AutoMod rule.",
          inviteUrl: data.inviteUrl,
        });
        return;
      }
      setResult({ ok: true, msg: `Created rule ${data.name || ""} (${data.id}).` });
      setListed((prev) => [data, ...prev.filter((r) => r.id !== data.id)]);
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const listRules = async ({ botReady }) => {
    if (!botReady) return;
    setBusy("list");
    setResult(null);
    try {
      const res = await fetch(`/api/automod-rules?guildId=${encodeURIComponent(guildId)}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          ok: false,
          msg: data.error || "Failed to list rules.",
          inviteUrl: data.inviteUrl,
        });
        return;
      }
      setListed(data.rules || []);
      setResult({ ok: true, msg: `Loaded ${(data.rules || []).length} rule(s).` });
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const deleteRule = async (ruleId, { botReady }) => {
    if (!botReady) return;
    setBusy(`delete:${ruleId}`);
    setResult(null);
    try {
      const res = await fetch("/api/automod-rules", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, ruleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, msg: data.error || "Failed to delete rule." });
        return;
      }
      setListed((prev) => prev.filter((r) => r.id !== ruleId));
      setResult({ ok: true, msg: "Rule deleted." });
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <ToolPanel fill>
      <StatGrid>
        <StatCard label="Trigger" value={state.triggerType} accent />
        <StatCard label="Actions" value={state.actions.length} />
        <StatCard label="Enabled" value={state.enabled ? "Yes" : "No"} />
        <StatCard label="JSON chars" value={json.length} />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection
          title="AutoMod rule"
          description="Build POST /guilds/{guild.id}/auto-moderation/rules body"
          action={
            <Button size="sm" variant="secondary" onClick={() => setState(createExampleAutomod())}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          }
        >
          <FieldLabel>Name</FieldLabel>
          <Input
            value={state.name}
            onChange={(e) => update({ name: e.target.value.slice(0, 100) })}
            placeholder="Rule name"
            className="text-sm mb-4"
          />

          <FieldLabel>Trigger type</FieldLabel>
          <div className="grid sm:grid-cols-2 gap-1.5 mb-4">
            {TRIGGER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ triggerType: t.value })}
                className={cn(
                  "nx-selectable text-left py-2 px-3",
                  state.triggerType === t.value && "nx-selectable-active"
                )}
              >
                <span className="block text-[13px] font-semibold">{t.label}</span>
                <span className="block text-[11px] text-[var(--nx-text-muted)]">{t.description}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => update({ enabled: !state.enabled })}
            className={cn("nx-selectable py-2 px-3 mb-4", state.enabled && "nx-selectable-active")}
          >
            <span className="flex items-center gap-2">
              <CheckboxIndicator checked={state.enabled} />
              <span className="text-xs font-semibold">Enabled</span>
            </span>
          </button>

          {state.triggerType === 1 && (
            <div className="space-y-4 mb-4">
              <ListEditor
                label="Keywords"
                values={state.keywords}
                onChange={(keywords) => update({ keywords })}
                placeholder="Keyword"
                max={1000}
              />
              <ListEditor
                label="Regex patterns"
                values={state.regexPatterns}
                onChange={(regexPatterns) => update({ regexPatterns })}
                placeholder="badword"
                max={10}
              />
              <ListEditor
                label="Allow list"
                values={state.allowList}
                onChange={(allowList) => update({ allowList })}
                placeholder="Phrase"
                max={100}
              />
            </div>
          )}

          {state.triggerType === 4 && (
            <div className="space-y-4 mb-4">
              <FieldLabel>Presets</FieldLabel>
              <div className="grid grid-cols-3 gap-1.5">
                {KEYWORD_PRESETS.map((p) => {
                  const active = state.presets.includes(p.value);
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() =>
                        update({
                          presets: active
                            ? state.presets.filter((v) => v !== p.value)
                            : [...state.presets, p.value],
                        })
                      }
                      className={cn("nx-selectable py-2 px-2 text-center", active && "nx-selectable-active")}
                    >
                      <span className="text-xs font-semibold">{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <ListEditor
                label="Allow list"
                values={state.allowList}
                onChange={(allowList) => update({ allowList })}
                placeholder="Phrase"
              />
            </div>
          )}

          {state.triggerType === 5 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <FieldLabel>Mention limit</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={state.mentionLimit}
                  onChange={(e) => update({ mentionLimit: e.target.value })}
                  placeholder="Limit"
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => update({ mentionRaidProtection: !state.mentionRaidProtection })}
                  className={cn(
                    "nx-selectable w-full py-2.5 px-3",
                    state.mentionRaidProtection && "nx-selectable-active"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CheckboxIndicator checked={state.mentionRaidProtection} />
                    <span className="text-xs font-semibold">Raid protection</span>
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <FieldLabel hint="Comma-separated snowflakes">Exempt roles</FieldLabel>
              <Input
                value={state.exemptRoles}
                onChange={(e) => update({ exemptRoles: e.target.value })}
                placeholder="Role IDs"
                className="font-mono text-xs"
              />
            </div>
            <div>
              <FieldLabel hint="Comma-separated snowflakes">Exempt channels</FieldLabel>
              <Input
                value={state.exemptChannels}
                onChange={(e) => update({ exemptChannels: e.target.value })}
                placeholder="Channel IDs"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <FieldLabel>Actions</FieldLabel>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => update({ actions: [...state.actions, emptyAction(1)] })}
            >
              <Plus className="w-3.5 h-3.5" /> Action
            </Button>
          </div>

          <div className="space-y-2">
            {state.actions.map((action, index) => (
              <div key={action.id} className="rounded-lg border border-[var(--nx-border)] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Dropdown
                      value={action.type}
                      onChange={(type) =>
                        update({
                          actions: state.actions.map((a, i) =>
                            i === index ? { ...a, type: Number(type) } : a
                          ),
                        })
                      }
                      options={ACTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      update({ actions: state.actions.filter((_, i) => i !== index) })
                    }
                    className="p-2 rounded-md text-[var(--nx-red)] hover:bg-[var(--nx-red-soft)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {action.type === 1 && (
                  <Input
                    value={action.customMessage}
                    onChange={(e) =>
                      update({
                        actions: state.actions.map((a, i) =>
                          i === index ? { ...a, customMessage: e.target.value.slice(0, 150) } : a
                        ),
                      })
                    }
                    placeholder="Block message"
                    className="text-xs"
                  />
                )}
                {action.type === 2 && (
                  <Input
                    value={action.channelId}
                    onChange={(e) =>
                      update({
                        actions: state.actions.map((a, i) =>
                          i === index
                            ? { ...a, channelId: e.target.value.replace(/\D/g, "") }
                            : a
                        ),
                      })
                    }
                    placeholder="Channel ID"
                    className="font-mono text-xs"
                  />
                )}
                {action.type === 3 && (
                  <Input
                    type="number"
                    value={action.durationSeconds}
                    onChange={(e) =>
                      update({
                        actions: state.actions.map((a, i) =>
                          i === index ? { ...a, durationSeconds: e.target.value } : a
                        ),
                      })
                    }
                    placeholder="Seconds"
                    className="font-mono text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </ToolSection>

        <div className="space-y-3 sm:space-y-4">
          <CopyCodeBlock
            label="Rule JSON"
            value={json}
            emptyHint="Configure the rule to generate paste-ready AutoMod JSON."
          />
          <BotGuildPanel
            title="Deploy with bot"
            description="Create or list AutoMod rules (bot needs Manage Server)"
            guildId={guildId}
            onGuildIdChange={setGuildId}
          >
            {({ botReady }) => (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!botReady || busy}
                    onClick={() => deploy({ botReady })}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {busy === "deploy" ? "Creating..." : "Create rule"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!botReady || busy}
                    onClick={() => listRules({ botReady })}
                  >
                    <List className="w-3.5 h-3.5" />
                    {busy === "list" ? "Loading..." : "List rules"}
                  </Button>
                </div>
                <BotActionResult result={result} />
                {listed.length > 0 && (
                  <ul className="space-y-1.5">
                    {listed.map((ruleItem) => (
                      <li
                        key={ruleItem.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-[var(--nx-border)] px-3 py-2 text-xs"
                      >
                        <span className="truncate">
                          {ruleItem.name || "Rule"}
                          <span className="text-[var(--nx-text-faint)] font-mono">
                            {" "}
                            · {ruleItem.id}
                          </span>
                        </span>
                        <button
                          type="button"
                          className="text-[var(--nx-red)] hover:underline shrink-0"
                          disabled={!botReady || busy}
                          onClick={() => deleteRule(ruleItem.id, { botReady })}
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </BotGuildPanel>
        </div>
      </div>
    </ToolPanel>
  );
}
