import { useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CheckboxIndicator } from "../ui/checkbox";
import { Toggle } from "../ui/toggle";
import ToolPanel, {
  ToolSection,
  FieldLabel,
  CopyCodeBlock,
  StatGrid,
  StatCard,
} from "../ToolPanel";
import {
  INTERACTION_TYPES,
  MESSAGE_FLAG_OPTIONS,
  buildInteractionResponse,
  createDefaultState,
  emptyChoice,
  emptyModalInput,
  responseSupportsFlags,
  responseSupportsMessage,
} from "../../lib/interactions";
import { cn } from "@/lib/utils";

export default function InteractionTool() {
  const [state, setState] = useState(createDefaultState);

  const update = (patch) => setState((prev) => ({ ...prev, ...patch }));

  const typeMeta = INTERACTION_TYPES.find((t) => t.value === state.type);
  const result = useMemo(() => buildInteractionResponse(state), [state]);
  const json = result.error ? "" : JSON.stringify(result, null, 2);

  const toggleFlag = (key) => {
    update({
      flags: state.flags.includes(key)
        ? state.flags.filter((k) => k !== key)
        : [...state.flags, key],
    });
  };

  return (
    <ToolPanel fill>
      <StatGrid>
        <StatCard label="Type" value={state.type} accent />
        <StatCard label="Name" value={typeMeta?.id?.replaceAll("_", " ") || "—"} />
        <StatCard
          label="Flags"
          value={responseSupportsFlags(state.type) ? state.flags.length : "—"}
        />
        <StatCard label="Status" value={result.error ? "Invalid" : "Ready"} />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection
          title="Response"
          description="Build Interaction Response JSON for the Interactions API"
          action={
            <Button size="sm" variant="secondary" onClick={() => setState(createDefaultState())}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          }
        >
          <FieldLabel>Callback type</FieldLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
            {INTERACTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ type: t.value })}
                className={cn(
                  "nx-selectable text-left py-2 px-3",
                  state.type === t.value && "nx-selectable-active"
                )}
              >
                <span className="block text-[13px] font-semibold text-[var(--nx-text-heading)]">
                  {t.label}
                </span>
                <span className="block text-[11px] text-[var(--nx-text-muted)] mt-0.5">
                  {t.description}
                </span>
              </button>
            ))}
          </div>

          {responseSupportsFlags(state.type) && (
            <div className="mb-4">
              <FieldLabel>Flags</FieldLabel>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {MESSAGE_FLAG_OPTIONS.map((flag) => {
                  const active = state.flags.includes(flag.key);
                  return (
                    <button
                      key={flag.key}
                      type="button"
                      onClick={() => toggleFlag(flag.key)}
                      className={cn("nx-selectable flex items-start gap-2.5", active && "nx-selectable-active")}
                    >
                      <CheckboxIndicator checked={active} className="mt-0.5" />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-[var(--nx-text-heading)]">
                          {flag.label}
                        </span>
                        <span className="block text-[11px] text-[var(--nx-text-muted)]">
                          {flag.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {responseSupportsMessage(state.type) && (
            <div className="space-y-4">
              <div>
                <FieldLabel hint="Leave empty for components/embeds only">Content</FieldLabel>
                <textarea
                  value={state.content}
                  onChange={(e) => update({ content: e.target.value })}
                  placeholder="Message"
                  className="nx-input min-h-[88px] py-2.5 text-sm resize-y w-full"
                />
              </div>

              <Toggle
                checked={state.tts}
                onCheckedChange={(v) => update({ tts: v })}
                label="TTS"
              />

              <div>
                <Toggle
                  checked={state.includeEmbeds}
                  onCheckedChange={(v) => update({ includeEmbeds: v })}
                  className="mb-2"
                  label="Include embeds JSON"
                />
                {state.includeEmbeds && (
                  <textarea
                    value={state.embedsJson}
                    onChange={(e) => update({ embedsJson: e.target.value })}
                    placeholder="Paste embed JSON"
                    className="nx-input font-mono text-xs min-h-[120px] py-2.5 resize-y w-full"
                    spellCheck={false}
                  />
                )}
              </div>

              <div>
                <Toggle
                  checked={state.includeComponents}
                  onCheckedChange={(v) => update({ includeComponents: v })}
                  className="mb-2"
                  label="Include components JSON"
                />
                {state.includeComponents && (
                  <textarea
                    value={state.componentsJson}
                    onChange={(e) => update({ componentsJson: e.target.value })}
                    placeholder="Paste component JSON"
                    className="nx-input font-mono text-xs min-h-[140px] py-2.5 resize-y w-full"
                    spellCheck={false}
                  />
                )}
              </div>
            </div>
          )}

          {state.type === 8 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel>Choices ({state.choices.length}/25)</FieldLabel>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={state.choices.length >= 25}
                  onClick={() =>
                    update({
                      choices: [
                        ...state.choices,
                        { ...emptyChoice(), name: `Choice ${state.choices.length + 1}`, value: `c${state.choices.length + 1}` },
                      ],
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              {state.choices.map((choice, index) => (
                <div key={choice.id} className="flex gap-2 items-start">
                  <Input
                    value={choice.name}
                    onChange={(e) =>
                      update({
                        choices: state.choices.map((c, i) =>
                          i === index ? { ...c, name: e.target.value.slice(0, 100) } : c
                        ),
                      })
                    }
                    placeholder="Name"
                    className="text-sm"
                  />
                  <Input
                    value={choice.value}
                    onChange={(e) =>
                      update({
                        choices: state.choices.map((c, i) =>
                          i === index ? { ...c, value: e.target.value.slice(0, 100) } : c
                        ),
                      })
                    }
                    placeholder="Value"
                    className="font-mono text-xs"
                  />
                  <button
                    type="button"
                    disabled={state.choices.length <= 1}
                    onClick={() =>
                      update({ choices: state.choices.filter((_, i) => i !== index) })
                    }
                    className="p-2 rounded-md text-[var(--nx-red)] hover:bg-[var(--nx-red-soft)] disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {state.type === 9 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Modal title</FieldLabel>
                  <Input
                    value={state.modal.title}
                    onChange={(e) =>
                      update({
                        modal: { ...state.modal, title: e.target.value.slice(0, 45) },
                      })
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <FieldLabel>Custom ID</FieldLabel>
                  <Input
                    value={state.modal.customId}
                    onChange={(e) =>
                      update({
                        modal: { ...state.modal, customId: e.target.value.slice(0, 100) },
                      })
                    }
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <FieldLabel>Text inputs ({state.modal.inputs.length}/5)</FieldLabel>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={state.modal.inputs.length >= 5}
                  onClick={() =>
                    update({
                      modal: {
                        ...state.modal,
                        inputs: [
                          ...state.modal.inputs,
                          {
                            ...emptyModalInput(),
                            customId: `field_${state.modal.inputs.length + 1}`,
                            label: `Field ${state.modal.inputs.length + 1}`,
                          },
                        ],
                      },
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>

              {state.modal.inputs.map((input, index) => (
                <div
                  key={input.id}
                  className="rounded-lg border border-[var(--nx-border)] p-3 space-y-2"
                >
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold uppercase text-[var(--nx-text-faint)]">
                      Input {index + 1}
                    </span>
                    {state.modal.inputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          update({
                            modal: {
                              ...state.modal,
                              inputs: state.modal.inputs.filter((_, i) => i !== index),
                            },
                          })
                        }
                        className="text-[var(--nx-red)] text-[11px] hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={input.label}
                      onChange={(e) =>
                        update({
                          modal: {
                            ...state.modal,
                            inputs: state.modal.inputs.map((inp, i) =>
                              i === index ? { ...inp, label: e.target.value.slice(0, 45) } : inp
                            ),
                          },
                        })
                      }
                      placeholder="Label"
                      className="text-sm"
                    />
                    <Input
                      value={input.customId}
                      onChange={(e) =>
                        update({
                          modal: {
                            ...state.modal,
                            inputs: state.modal.inputs.map((inp, i) =>
                              i === index
                                ? { ...inp, customId: e.target.value.slice(0, 100) }
                                : inp
                            ),
                          },
                        })
                      }
                      placeholder="Custom ID"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() =>
                          update({
                            modal: {
                              ...state.modal,
                              inputs: state.modal.inputs.map((inp, i) =>
                                i === index ? { ...inp, style } : inp
                              ),
                            },
                          })
                        }
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-semibold border",
                          input.style === style
                            ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)]"
                            : "border-[var(--nx-border)] text-[var(--nx-text-muted)]"
                        )}
                      >
                        {style === 1 ? "Short" : "Paragraph"}
                      </button>
                    ))}
                    <Toggle
                      size="sm"
                      checked={input.required}
                      onCheckedChange={(v) =>
                        update({
                          modal: {
                            ...state.modal,
                            inputs: state.modal.inputs.map((inp, i) =>
                              i === index ? { ...inp, required: v } : inp
                            ),
                          },
                        })
                      }
                      label="Required"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {(state.type === 5 || state.type === 6 || state.type === 1) && (
            <p className="text-xs text-[var(--nx-text-muted)] leading-relaxed">
              {state.type === 1 && "Reply to Discord’s PING with a bare type 1 ACK."}
              {state.type === 5 &&
                "Shows a thinking state. Follow up later with PATCH /webhooks/{app}/{token}/messages/@original."}
              {state.type === 6 &&
                "Acknowledges a component click without changing the message yet."}
            </p>
          )}
        </ToolSection>

        <div className="space-y-3 sm:space-y-4">
          {result.error && (
            <p className="text-sm text-[var(--nx-red)] px-1">{result.error}</p>
          )}
          <CopyCodeBlock
            label="Interaction response"
            value={json}
            emptyHint="Fix JSON errors to generate a response payload."
            className="xl:sticky xl:top-0"
          />
        </div>
      </div>
    </ToolPanel>
  );
}
