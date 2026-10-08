import { useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Dropdown from "../ui/Dropdown";
import { Toggle } from "../ui/toggle";
import ToolPanel, { ToolSection, FieldLabel, CopyCodeBlock } from "../ToolPanel";
import DiscordSendPanel from "../DiscordSendPanel";
import {
  BUTTON_STYLES,
  CHANNEL_TYPES,
  SELECT_TYPES,
  TEXT_INPUT_STYLES,
  buildComponentsPayload,
  buildModalPayload,
  createExampleComponents,
  createExampleModal,
  emptyActionRow,
  emptyButton,
  emptySelect,
  emptySelectOption,
  emptyTextInput,
} from "../../lib/components";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "message", label: "Message components" },
  { id: "modal", label: "Modal" },
];

function ButtonEditor({ button, onChange, onRemove, canRemove }) {
  const isLink = button.style === 5;
  const isPremium = button.style === 6;

  return (
    <div className="rounded-lg border border-[var(--nx-border)] p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--nx-text-muted)]">
          Button
        </span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-[var(--nx-red)] text-xs hover:underline">
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <FieldLabel>Style</FieldLabel>
          <Dropdown
            value={button.style}
            onChange={(style) => onChange({ ...button, style: Number(style) })}
            options={BUTTON_STYLES.map((s) => ({ value: s.value, label: s.label }))}
          />
        </div>
        {!isPremium && (
          <div>
            <FieldLabel>Label</FieldLabel>
            <Input
              value={button.label}
              onChange={(e) => onChange({ ...button, label: e.target.value.slice(0, 80) })}
              placeholder="Button label"
              className="text-sm"
            />
          </div>
        )}
        {!isLink && !isPremium && (
          <div>
            <FieldLabel>Custom ID</FieldLabel>
            <Input
              value={button.customId}
              onChange={(e) => onChange({ ...button, customId: e.target.value.slice(0, 100) })}
              placeholder="Custom ID"
              className="font-mono text-xs"
            />
          </div>
        )}
        {isLink && (
          <div>
            <FieldLabel>URL</FieldLabel>
            <Input
              value={button.url}
              onChange={(e) => onChange({ ...button, url: e.target.value })}
              placeholder="https://…"
              className="font-mono text-xs"
            />
          </div>
        )}
        {isPremium && (
          <div>
            <FieldLabel>SKU ID</FieldLabel>
            <Input
              value={button.skuId}
              onChange={(e) => onChange({ ...button, skuId: e.target.value.replace(/\D/g, "") })}
              placeholder="Snowflake ID"
              className="font-mono text-xs"
            />
          </div>
        )}
        <div>
          <FieldLabel hint="Unicode or custom name">Emoji name</FieldLabel>
          <Input
            value={button.emojiName}
            onChange={(e) => onChange({ ...button, emojiName: e.target.value })}
            placeholder="Emoji"
            className="text-sm"
          />
        </div>
        <div>
          <FieldLabel hint="Custom emoji only">Emoji ID</FieldLabel>
          <Input
            value={button.emojiId}
            onChange={(e) => onChange({ ...button, emojiId: e.target.value.replace(/\D/g, "") })}
            placeholder="ID"
            className="font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Toggle
          checked={button.disabled}
          onCheckedChange={(v) => onChange({ ...button, disabled: v })}
          label="Disabled"
        />
        {button.emojiId && (
          <Toggle
            checked={button.emojiAnimated}
            onCheckedChange={(v) => onChange({ ...button, emojiAnimated: v })}
            label="Animated emoji"
          />
        )}
      </div>
    </div>
  );
}

function SelectEditor({ select, onChange, onRemove }) {
  const isString = select.type === 3;
  const isChannel = select.type === 8;

  const updateOption = (index, patch) => {
    onChange({
      ...select,
      options: select.options.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    });
  };

  return (
    <div className="rounded-lg border border-[var(--nx-border)] p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--nx-text-muted)]">
          Select menu
        </span>
        <button type="button" onClick={onRemove} className="text-[var(--nx-red)] text-xs hover:underline">
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <FieldLabel>Type</FieldLabel>
          <Dropdown
            value={select.type}
            onChange={(type) => {
              const next = Number(type);
              onChange({
                ...select,
                type: next,
                options: next === 3 ? select.options?.length ? select.options : [emptySelectOption()] : [],
                channelTypes: next === 8 ? select.channelTypes?.length ? select.channelTypes : [0] : [],
              });
            }}
            options={SELECT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
        </div>
        <div>
          <FieldLabel>Custom ID</FieldLabel>
          <Input
            value={select.customId}
            onChange={(e) => onChange({ ...select, customId: e.target.value.slice(0, 100) })}
            placeholder="Custom ID"
            className="font-mono text-xs"
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Placeholder</FieldLabel>
          <Input
            value={select.placeholder}
            onChange={(e) => onChange({ ...select, placeholder: e.target.value.slice(0, 150) })}
            placeholder="Placeholder"
            className="text-sm"
          />
        </div>
        <div>
          <FieldLabel>Min values</FieldLabel>
          <Input
            type="number"
            min={0}
            max={25}
            value={select.minValues}
            onChange={(e) => onChange({ ...select, minValues: e.target.value })}
            className="font-mono text-xs"
          />
        </div>
        <div>
          <FieldLabel>Max values</FieldLabel>
          <Input
            type="number"
            min={1}
            max={25}
            value={select.maxValues}
            onChange={(e) => onChange({ ...select, maxValues: e.target.value })}
            className="font-mono text-xs"
          />
        </div>
      </div>

      <Toggle
        checked={select.disabled}
        onCheckedChange={(v) => onChange({ ...select, disabled: v })}
        label="Disabled"
      />

      {isChannel && (
        <div>
          <FieldLabel>Channel types</FieldLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {CHANNEL_TYPES.map((ct) => {
              const active = select.channelTypes.includes(ct.value);
              return (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? select.channelTypes.filter((v) => v !== ct.value)
                      : [...select.channelTypes, ct.value];
                    onChange({ ...select, channelTypes: next });
                  }}
                  className={cn("nx-selectable py-1.5 px-2 text-left", active && "nx-selectable-active")}
                >
                  <span className="text-[11px] font-semibold">{ct.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isString && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FieldLabel>Options ({select.options.length}/25)</FieldLabel>
            <Button
              size="sm"
              variant="secondary"
              disabled={select.options.length >= 25}
              onClick={() =>
                onChange({
                  ...select,
                  options: [
                    ...select.options,
                    { ...emptySelectOption(), label: `Option ${select.options.length + 1}`, value: `option_${select.options.length + 1}` },
                  ],
                })
              }
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
          {select.options.map((opt, index) => (
            <div key={opt.id} className="rounded-md border border-[var(--nx-border)] p-2.5 space-y-2 bg-[var(--nx-bg-overlay)]">
              <div className="flex justify-between gap-2">
                <span className="text-[10px] font-bold uppercase text-[var(--nx-text-faint)]">Option {index + 1}</span>
                {select.options.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...select, options: select.options.filter((_, i) => i !== index) })
                    }
                    className="text-[var(--nx-red)] text-[11px] hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={opt.label}
                  onChange={(e) => updateOption(index, { label: e.target.value.slice(0, 100) })}
                  placeholder="Label"
                  className="text-xs"
                />
                <Input
                  value={opt.value}
                  onChange={(e) => updateOption(index, { value: e.target.value.slice(0, 100) })}
                  placeholder="Value"
                  className="font-mono text-xs"
                />
              </div>
              <Input
                value={opt.description}
                onChange={(e) => updateOption(index, { description: e.target.value.slice(0, 100) })}
                placeholder="Description"
                className="text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TextInputEditor({ input, onChange, onRemove }) {
  return (
    <div className="rounded-lg border border-[var(--nx-border)] p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--nx-text-muted)]">
          Text input
        </span>
        <button type="button" onClick={onRemove} className="text-[var(--nx-red)] text-xs hover:underline">
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <FieldLabel>Label</FieldLabel>
          <Input
            value={input.label}
            onChange={(e) => onChange({ ...input, label: e.target.value.slice(0, 45) })}
            placeholder="Label"
            className="text-sm"
          />
        </div>
        <div>
          <FieldLabel>Custom ID</FieldLabel>
          <Input
            value={input.customId}
            onChange={(e) => onChange({ ...input, customId: e.target.value.slice(0, 100) })}
            placeholder="Custom ID"
            className="font-mono text-xs"
          />
        </div>
        <div>
          <FieldLabel>Style</FieldLabel>
          <Dropdown
            value={input.style}
            onChange={(style) => onChange({ ...input, style: Number(style) })}
            options={TEXT_INPUT_STYLES.map((s) => ({ value: s.value, label: s.label }))}
          />
        </div>
        <div>
          <FieldLabel>Placeholder</FieldLabel>
          <Input
            value={input.placeholder}
            onChange={(e) => onChange({ ...input, placeholder: e.target.value.slice(0, 100) })}
            placeholder="Placeholder"
            className="text-sm"
          />
        </div>
        <div>
          <FieldLabel>Min length</FieldLabel>
          <Input
            type="number"
            value={input.minLength}
            onChange={(e) => onChange({ ...input, minLength: e.target.value })}
            className="font-mono text-xs"
          />
        </div>
        <div>
          <FieldLabel>Max length</FieldLabel>
          <Input
            type="number"
            value={input.maxLength}
            onChange={(e) => onChange({ ...input, maxLength: e.target.value })}
            className="font-mono text-xs"
          />
        </div>
      </div>
      <Toggle
        checked={input.required}
        onCheckedChange={(v) => onChange({ ...input, required: v })}
        label="Required"
      />
    </div>
  );
}

function RowEditor({ row, mode, onChange, onRemove, canRemove }) {
  const childKind = row.children[0]?.kind || (mode === "modal" ? "text_input" : "button");
  const isSelectRow = childKind === "select";
  const isTextRow = childKind === "text_input";
  const maxChildren = isSelectRow || isTextRow ? 1 : 5;

  const updateChild = (index, next) => {
    onChange({ ...row, children: row.children.map((c, i) => (i === index ? next : c)) });
  };

  const removeChild = (index) => {
    onChange({ ...row, children: row.children.filter((_, i) => i !== index) });
  };

  const addChild = () => {
    if (row.children.length >= maxChildren) return;
    if (isSelectRow) return;
    if (isTextRow) return;
    onChange({
      ...row,
      children: [
        ...row.children,
        { ...emptyButton(), label: `Button ${row.children.length + 1}`, customId: `button_${row.children.length + 1}` },
      ],
    });
  };

  return (
    <div className="rounded-xl border border-[var(--nx-border)] p-3 sm:p-4 space-y-3 bg-[var(--nx-bg-surface)]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--nx-text-heading)]">
          Action row · {isTextRow ? "Text input" : isSelectRow ? "Select" : "Buttons"}
        </h4>
        <div className="flex items-center gap-2">
          {!isSelectRow && !isTextRow && (
            <Button size="sm" variant="secondary" disabled={row.children.length >= 5} onClick={addChild}>
              <Plus className="w-3.5 h-3.5" /> Button
            </Button>
          )}
          {canRemove && (
            <button type="button" onClick={onRemove} className="p-1.5 rounded-md text-[var(--nx-red)] hover:bg-[var(--nx-red-soft)]">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {row.children.map((child, index) => {
          if (child.kind === "button") {
            return (
              <ButtonEditor
                key={child.id}
                button={child}
                onChange={(next) => updateChild(index, next)}
                onRemove={() => removeChild(index)}
                canRemove={row.children.length > 1}
              />
            );
          }
          if (child.kind === "select") {
            return (
              <SelectEditor
                key={child.id}
                select={child}
                onChange={(next) => updateChild(index, next)}
                onRemove={onRemove}
              />
            );
          }
          return (
            <TextInputEditor
              key={child.id}
              input={child}
              onChange={(next) => updateChild(index, next)}
              onRemove={onRemove}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function ComponentsTool() {
  const [mode, setMode] = useState("message");
  const [rows, setRows] = useState(createExampleComponents);
  const [modalMeta, setModalMeta] = useState(() => {
    const example = createExampleModal();
    return { customId: example.customId, title: example.title };
  });
  const [modalRows, setModalRows] = useState(() => createExampleModal().rows);

  const activeRows = mode === "modal" ? modalRows : rows;
  const setActiveRows = mode === "modal" ? setModalRows : setRows;

  const payload = useMemo(() => {
    if (mode === "modal") {
      return buildModalPayload({ ...modalMeta, rows: modalRows });
    }
    return { components: buildComponentsPayload(rows) };
  }, [mode, rows, modalRows, modalMeta]);

  const json = JSON.stringify(payload, null, 2);

  const addRow = (kind) => {
    if (mode === "modal") {
      if (modalRows.length >= 5) return;
      setModalRows((prev) => [...prev, emptyActionRow("text_input")]);
      return;
    }
    if (rows.length >= 5) return;
    setRows((prev) => [...prev, emptyActionRow(kind)]);
  };

  const reset = () => {
    if (mode === "modal") {
      const example = createExampleModal();
      setModalMeta({ customId: example.customId, title: example.title });
      setModalRows(example.rows);
    } else {
      setRows(createExampleComponents());
    }
  };

  return (
    <ToolPanel fill>
      <div className="flex flex-wrap gap-2 mb-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
              mode === m.id
                ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)] text-[var(--nx-text-heading)]"
                : "border-[var(--nx-border)] text-[var(--nx-text-muted)] hover:bg-[var(--nx-hover-bg)]"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection
          title="Builder"
          description={
            mode === "modal"
              ? "Up to 5 text inputs — one per action row"
              : "Up to 5 action rows · 5 buttons or 1 select per row"
          }
          action={
            <Button size="sm" variant="secondary" onClick={reset}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          }
        >
          {mode === "modal" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <div>
                <FieldLabel>Modal title</FieldLabel>
                <Input
                  value={modalMeta.title}
                  onChange={(e) => setModalMeta((m) => ({ ...m, title: e.target.value.slice(0, 45) }))}
                  placeholder="Title"
                  className="text-sm"
                />
              </div>
              <div>
                <FieldLabel>Custom ID</FieldLabel>
                <Input
                  value={modalMeta.customId}
                  onChange={(e) => setModalMeta((m) => ({ ...m, customId: e.target.value.slice(0, 100) }))}
                  placeholder="Custom ID"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {activeRows.map((row, index) => (
              <RowEditor
                key={row.id}
                row={row}
                mode={mode}
                onChange={(next) =>
                  setActiveRows((prev) => prev.map((r, i) => (i === index ? next : r)))
                }
                onRemove={() => setActiveRows((prev) => prev.filter((_, i) => i !== index))}
                canRemove={activeRows.length > 1}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {mode === "message" ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={rows.length >= 5}
                  onClick={() => addRow("button")}
                >
                  <Plus className="w-3.5 h-3.5" /> Button row
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={rows.length >= 5}
                  onClick={() => addRow("select")}
                >
                  <Plus className="w-3.5 h-3.5" /> Select row
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                disabled={modalRows.length >= 5}
                onClick={() => addRow("text_input")}
              >
                <Plus className="w-3.5 h-3.5" /> Text input
              </Button>
            )}
          </div>
        </ToolSection>

        <div className="space-y-3 sm:space-y-4">
          <CopyCodeBlock
            label="JSON"
            value={json}
            emptyHint="Configure components to generate paste-ready JSON."
          />
          {mode === "message" && (
            <DiscordSendPanel
              payload={payload}
              enabled={Array.isArray(payload.components) && payload.components.length > 0}
              description="Send message components via webhook or bot"
            />
          )}
          {mode === "modal" && (
            <ToolSection title="Send to Discord" description="Modals require an interaction response token">
              <p className="text-sm text-[var(--nx-text-muted)]">
                Modal JSON is for interaction callbacks only — use an interaction token (not bot channel send).
              </p>
            </ToolSection>
          )}
        </div>
      </div>
    </ToolPanel>
  );
}
