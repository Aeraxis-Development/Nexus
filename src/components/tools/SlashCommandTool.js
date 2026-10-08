import ToolPanel, { ToolSection, FieldLabel, CopyCodeBlock } from "../ToolPanel";
import BotGuildPanel, { BotActionResult } from "../BotGuildPanel";
import {
  COMMAND_TYPES,
  OPTION_TYPES,
  supportsChoices,
  isNestedOption,
  buildCommandJson,
  validateCommandName,
  validateOptionName,
  getRegisterEndpoint,
} from "../../lib/slashCommands";
import { useNexus } from "../../context/NexusContext";
import { cn } from "@/lib/utils";
import { Toggle } from "../ui/toggle";
import { useState, useMemo } from "react";
import { Plus, Trash2, RotateCcw, Upload, List, Trash } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Dropdown from "../ui/Dropdown";
import { Checkbox } from "../ui/checkbox";

let uid = 0;
const nextId = () => `_${++uid}_${Date.now()}`;

const emptyChoice = () => ({ id: nextId(), name: "", value: "" });

const emptyOption = (type = 3) => ({
  id: nextId(),
  type,
  name: "",
  description: "",
  required: false,
  autocomplete: false,
  minLength: "",
  maxLength: "",
  minValue: "",
  maxValue: "",
  channelTypes: [],
  choices: [],
  options: [],
  nameLocalizations: "",
  descriptionLocalizations: "",
});

function createExampleCommand() {
  return {
    name: "echo",
    description: "Echo a message back to the channel",
    type: 1,
    dmPermission: true,
    nsfw: false,
    defaultMemberPermissions: "",
    nameLocalizations: "",
    descriptionLocalizations: "",
    options: [
      {
        ...emptyOption(3),
        name: "message",
        description: "The text to echo",
        required: true,
        maxLength: "2000",
        choices: [
          { id: nextId(), name: "Hello", value: "Hello!" },
          { id: nextId(), name: "Ping", value: "Pong!" },
        ],
      },
      {
        ...emptyOption(5),
        name: "ephemeral",
        description: "Reply only visible to the user",
        required: false,
      },
    ],
  };
}

function OptionEditor({ option, siblings, onChange, onRemove, depth = 0 }) {
  const nameError = option.name ? validateOptionName(option.name, siblings) : null;
  const nested = isNestedOption(option.type);

  const update = (patch) => onChange({ ...option, ...patch });

  const addChoice = () => {
    if (option.choices.length >= 25) return;
    update({ choices: [...option.choices, emptyChoice()] });
  };

  const updateChoice = (index, patch) => {
    update({
      choices: option.choices.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    });
  };

  const removeChoice = (index) => {
    update({ choices: option.choices.filter((_, i) => i !== index) });
  };

  const addNestedOption = () => {
    if (option.options.length >= 25) return;
    update({ options: [...option.options, emptyOption(option.type === 2 ? 1 : 3)] });
  };

  const updateNestedOption = (index, next) => {
    update({ options: option.options.map((o, i) => (i === index ? next : o)) });
  };

  const removeNestedOption = (index) => {
    update({ options: option.options.filter((_, i) => i !== index) });
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--nx-border)] p-3 space-y-3",
        depth > 0 && "bg-[var(--nx-bg-overlay)]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--nx-text-muted)]">
          {OPTION_TYPES.find((t) => t.value === option.type)?.label || "Option"}
        </span>
        <button type="button" onClick={onRemove} className="text-[#f23f43] text-xs hover:underline">
          Remove
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>Name</FieldLabel>
          <Input
            value={option.name}
            onChange={(e) => update({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
            placeholder="Name"
            className="font-mono text-xs"
          />
          {nameError && <p className="mt-1 text-xs text-[#f0b232]">{nameError}</p>}
        </div>
        <div>
          <FieldLabel>Type</FieldLabel>
          <Dropdown
            value={option.type}
            onChange={(type) => {
              const nextType = Number(type);
              const patch = { type: nextType };
              if (isNestedOption(nextType) && !option.options.length) {
                patch.options = [emptyOption(nextType === 2 ? 1 : 3)];
              }
              if (!supportsChoices(nextType)) patch.choices = [];
              update(patch);
            }}
            options={OPTION_TYPES.filter((t) => depth === 0 || t.value > 2).map((t) => ({
              value: t.value,
              label: t.label,
            }))}
            aria-label="Option type"
          />
        </div>
      </div>

      <div>
        <FieldLabel>Description</FieldLabel>
        <Input
          value={option.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Description"
        />
      </div>

      {!nested && (
        <Checkbox
          checked={option.required}
          onCheckedChange={(v) => update({ required: v })}
          label="Required"
          labelClassName="text-[var(--nx-text)]"
        />
      )}

      {option.type === 3 && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel hint="Optional">Min length</FieldLabel>
            <Input
              value={option.minLength}
              onChange={(e) => update({ minLength: e.target.value.replace(/\D/g, "") })}
              placeholder="0"
              className="font-mono text-xs"
            />
          </div>
          <div>
            <FieldLabel hint="Optional">Max length</FieldLabel>
            <Input
              value={option.maxLength}
              onChange={(e) => update({ maxLength: e.target.value.replace(/\D/g, "") })}
              placeholder="Max"
              className="font-mono text-xs"
            />
          </div>
          <Checkbox
            checked={option.autocomplete}
            onCheckedChange={(v) => update({ autocomplete: v })}
            className="col-span-2"
            label="Autocomplete"
            labelClassName="text-[var(--nx-text)]"
          />
        </div>
      )}

      {(option.type === 4 || option.type === 10) && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel hint="Optional">Min value</FieldLabel>
            <Input
              value={option.minValue}
              onChange={(e) => update({ minValue: e.target.value })}
              placeholder="Min"
              className="font-mono text-xs"
            />
          </div>
          <div>
            <FieldLabel hint="Optional">Max value</FieldLabel>
            <Input
              value={option.maxValue}
              onChange={(e) => update({ maxValue: e.target.value })}
              placeholder="Max"
              className="font-mono text-xs"
            />
          </div>
        </div>
      )}

      {supportsChoices(option.type) && (
        <div className="space-y-2">
          <FieldLabel hint="Up to 25 choices">Choices</FieldLabel>
          {option.choices.map((choice, i) => (
            <div key={choice.id} className="flex gap-2">
              <Input
                value={choice.name}
                onChange={(e) => updateChoice(i, { name: e.target.value })}
                placeholder="Display name"
                className="flex-1"
              />
              <Input
                value={choice.value}
                onChange={(e) => updateChoice(i, { value: e.target.value })}
                placeholder="Value"
                className="flex-1 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => removeChoice(i)}
                className="text-[#f23f43] px-2 text-xs hover:underline shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
          {option.choices.length < 25 && (
            <Button type="button" variant="secondary" size="sm" onClick={addChoice}>
              <Plus className="w-3.5 h-3.5" />
              Add choice
            </Button>
          )}
        </div>
      )}

      {nested && (
        <div className="space-y-2 pl-2 border-l-2 border-[var(--nx-border-accent)]">
          <FieldLabel>
            {option.type === 2 ? "Subcommands in group" : "Subcommand options"}
          </FieldLabel>
          {option.options.map((child, i) => (
            <OptionEditor
              key={child.id}
              option={child}
              siblings={option.options}
              onChange={(next) => updateNestedOption(i, next)}
              onRemove={() => removeNestedOption(i)}
              depth={depth + 1}
            />
          ))}
          {option.options.length < 25 && (
            <Button type="button" variant="secondary" size="sm" onClick={addNestedOption}>
              <Plus className="w-3.5 h-3.5" />
              Add {option.type === 2 ? "subcommand" : "option"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function SlashCommandTool() {
  const { clientId } = useNexus();
  const [initial] = useState(() => createExampleCommand());
  const [command, setCommand] = useState(initial);
  const [guildId, setGuildId] = useState("");
  const [scope, setScope] = useState("guild"); // guild | global
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const [listed, setListed] = useState([]);

  const updateCommand = (patch) => setCommand((prev) => ({ ...prev, ...patch }));

  const addOption = () => {
    if (command.options.length >= 25) return;
    updateCommand({ options: [...command.options, emptyOption(3)] });
  };

  const updateOption = (index, next) => {
    updateCommand({
      options: command.options.map((o, i) => (i === index ? next : o)),
    });
  };

  const removeOption = (index) => {
    updateCommand({ options: command.options.filter((_, i) => i !== index) });
  };

  const resetToExample = () => setCommand(createExampleCommand());

  const nameError = command.name ? validateCommandName(command.name) : null;
  const payloadObj = useMemo(() => buildCommandJson(command), [command]);
  const payload = JSON.stringify(payloadObj, null, 2);
  const deployGuildId = scope === "guild" ? guildId : "";
  const endpoint = getRegisterEndpoint(clientId, deployGuildId);
  const hasSubcommands = command.options.some((o) => isNestedOption(o.type));
  const canAddLeafOptions = command.type === 1 && !hasSubcommands;

  const deploy = async ({ botReady }) => {
    if (scope === "guild" && !botReady) return;
    if (nameError || !command.name.trim()) {
      setResult({ ok: false, msg: nameError || "Command name is required." });
      return;
    }
    setBusy("deploy");
    setResult(null);
    try {
      const res = await fetch("/api/application-commands", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(deployGuildId && { guildId: deployGuildId }),
          payload: payloadObj,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          ok: false,
          msg: data.error || "Failed to deploy command.",
          inviteUrl: data.inviteUrl,
        });
        return;
      }
      setResult({
        ok: true,
        msg: `Deployed /${data.name || command.name}${data.id ? ` (${data.id})` : ""}.`,
      });
      setListed((prev) => {
        const next = prev.filter((c) => c.id !== data.id);
        return [data, ...next];
      });
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const listCommands = async ({ botReady }) => {
    if (scope === "guild" && !botReady) return;
    setBusy("list");
    setResult(null);
    try {
      const params = new URLSearchParams();
      if (deployGuildId) params.set("guildId", deployGuildId);
      const res = await fetch(`/api/application-commands?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          ok: false,
          msg: data.error || "Failed to list commands.",
          inviteUrl: data.inviteUrl,
        });
        return;
      }
      setListed(data.commands || []);
      setResult({
        ok: true,
        msg: `Loaded ${(data.commands || []).length} command(s).`,
      });
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const deleteCommand = async (commandId, { botReady }) => {
    if (scope === "guild" && !botReady) return;
    setBusy(`delete:${commandId}`);
    setResult(null);
    try {
      const res = await fetch("/api/application-commands", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(deployGuildId && { guildId: deployGuildId }),
          commandId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, msg: data.error || "Failed to delete command." });
        return;
      }
      setListed((prev) => prev.filter((c) => c.id !== commandId));
      setResult({ ok: true, msg: "Command deleted." });
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <ToolPanel fill>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-sm text-[var(--nx-text-muted)]">
          Build application command JSON for Discord&apos;s REST API.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={resetToExample}>
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to example
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-4">
          <ToolSection title="Command">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    value={command.name}
                    onChange={(e) =>
                      updateCommand({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })
                    }
                    placeholder="Name"
                    className="font-mono"
                  />
                  {nameError && <p className="mt-1 text-xs text-[#f0b232]">{nameError}</p>}
                </div>
                <div>
                  <FieldLabel>Type</FieldLabel>
                  <Dropdown
                    value={command.type}
                    onChange={(type) => updateCommand({ type: Number(type), options: [] })}
                    options={COMMAND_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    aria-label="Command type"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Description</FieldLabel>
                <Input
                  value={command.description}
                  onChange={(e) => updateCommand({ description: e.target.value })}
                  placeholder="Description"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Toggle
                  checked={command.dmPermission}
                  onCheckedChange={(v) => updateCommand({ dmPermission: v })}
                  label="Allow in DMs"
                />
                <Toggle
                  checked={command.nsfw}
                  onCheckedChange={(v) => updateCommand({ nsfw: v })}
                  label="NSFW only"
                />
              </div>

              <div>
                <FieldLabel hint="Optional permission integer">Default member permissions</FieldLabel>
                <Input
                  value={command.defaultMemberPermissions}
                  onChange={(e) =>
                    updateCommand({ defaultMemberPermissions: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder="Bitfield"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </ToolSection>

          {command.type === 1 && (
            <ToolSection
              title="Options"
              description={
                hasSubcommands
                  ? "Subcommand groups replace top-level options"
                  : "Up to 25 options per command"
              }
            >
              <div className="space-y-3">
                {command.options.map((option, i) => (
                  <OptionEditor
                    key={option.id}
                    option={option}
                    siblings={command.options}
                    onChange={(next) => updateOption(i, next)}
                    onRemove={() => removeOption(i)}
                  />
                ))}

                {command.options.length < 25 && (
                  <div className="flex flex-wrap gap-2">
                    {canAddLeafOptions && (
                      <Button type="button" variant="secondary" size="sm" onClick={addOption}>
                        <Plus className="w-3.5 h-3.5" />
                        Add option
                      </Button>
                    )}
                    {!hasSubcommands && command.options.length === 0 && (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            updateCommand({ options: [emptyOption(1)] })
                          }
                        >
                          Add subcommand
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            updateCommand({ options: [emptyOption(2)] })
                          }
                        >
                          Add subcommand group
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </ToolSection>
          )}

          <ToolSection title="Register via API">
            <div className="inline-flex rounded-lg border border-[var(--nx-border)] p-0.5 bg-[#1e1f22] mb-3">
              {[
                { id: "guild", label: "Guild" },
                { id: "global", label: "Global" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setScope(mode.id);
                    setResult(null);
                    setListed([]);
                  }}
                  className={cn(
                    "h-8 px-3 rounded-md text-xs font-semibold transition-colors",
                    scope === mode.id
                      ? "bg-[#5865f2] text-white"
                      : "text-[#dbdee1] hover:bg-[#2b2d31]"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="text-xs font-mono text-[var(--nx-accent)] break-all bg-[var(--nx-bg-input)] p-3 rounded-lg border border-[var(--nx-border)] mb-3">
              {endpoint || "Set your application client ID in the OAuth tool"}
            </p>

            {scope === "global" ? (
              <div className="space-y-3">
                <p className="text-xs text-[var(--nx-text-muted)]">
                  Global commands can take up to an hour to propagate. Requires login (bot token deploys).
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || Boolean(nameError) || !command.name.trim()}
                    onClick={() => deploy({ botReady: true })}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {busy === "deploy" ? "Deploying..." : "Deploy"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => listCommands({ botReady: true })}
                  >
                    <List className="w-3.5 h-3.5" />
                    {busy === "list" ? "Loading..." : "List"}
                  </Button>
                </div>
                <BotActionResult result={result} />
                {listed.length > 0 && (
                  <ul className="space-y-1.5">
                    {listed.map((cmd) => (
                      <li
                        key={cmd.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-[var(--nx-border)] px-3 py-2 text-xs"
                      >
                        <span className="font-mono truncate">
                          /{cmd.name}
                          <span className="text-[var(--nx-text-faint)]"> · {cmd.id}</span>
                        </span>
                        <button
                          type="button"
                          className="text-[var(--nx-red)] hover:underline shrink-0"
                          disabled={busy}
                          onClick={() => deleteCommand(cmd.id, { botReady: true })}
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <BotGuildPanel
                bare
                guildId={guildId}
                onGuildIdChange={setGuildId}
                requireBot
              >
                {({ botReady }) => (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!botReady || busy || Boolean(nameError) || !command.name.trim()}
                        onClick={() => deploy({ botReady })}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {busy === "deploy" ? "Deploying..." : "Deploy"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!botReady || busy}
                        onClick={() => listCommands({ botReady })}
                      >
                        <List className="w-3.5 h-3.5" />
                        {busy === "list" ? "Loading..." : "List"}
                      </Button>
                    </div>
                    <BotActionResult result={result} />
                    {listed.length > 0 && (
                      <ul className="space-y-1.5">
                        {listed.map((cmd) => (
                          <li
                            key={cmd.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-[var(--nx-border)] px-3 py-2 text-xs"
                          >
                            <span className="font-mono truncate">
                              /{cmd.name}
                              <span className="text-[var(--nx-text-faint)]"> · {cmd.id}</span>
                            </span>
                            <button
                              type="button"
                              className="text-[var(--nx-red)] hover:underline shrink-0"
                              disabled={!botReady || busy}
                              onClick={() => deleteCommand(cmd.id, { botReady })}
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
            )}
          </ToolSection>
        </div>

        <CopyCodeBlock
          value={payload}
          label="Command JSON"
          description="Ready to POST to Discord's application commands endpoint"
          className="xl:sticky xl:top-0"
        />
      </div>
    </ToolPanel>
  );
}
