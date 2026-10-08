import { useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CheckboxIndicator } from "../ui/checkbox";
import ToolPanel, {
  ToolSection,
  FieldLabel,
  CopyField,
  StatGrid,
  StatCard,
} from "../ToolPanel";
import { permissions } from "../../lib/permissions";
import {
  computeEffective,
  createDefaultEffectiveState,
  emptyLayer,
} from "../../lib/effectivePermissions";
import { cn } from "@/lib/utils";

function PermFields({ allow, deny, onAllow, onDeny, showBase, base, onBase }) {
  return (
    <div className={cn("grid gap-2", showBase ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
      {showBase && (
        <div>
          <FieldLabel>Base permissions</FieldLabel>
          <Input
            value={base}
            onChange={(e) => onBase(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="0"
            className="font-mono text-xs"
          />
        </div>
      )}
      <div>
        <FieldLabel>Allow overwrite</FieldLabel>
        <Input
          value={allow}
          onChange={(e) => onAllow(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="0"
          className="font-mono text-xs"
        />
      </div>
      <div>
        <FieldLabel>Deny overwrite</FieldLabel>
        <Input
          value={deny}
          onChange={(e) => onDeny(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="0"
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}

export default function EffectivePermsTool() {
  const [state, setState] = useState(createDefaultEffectiveState);
  const result = useMemo(() => computeEffective(state), [state]);

  const update = (patch) => setState((prev) => ({ ...prev, ...patch }));

  return (
    <ToolPanel fill>
      <StatGrid>
        <StatCard label="Effective" value={result.value} accent mono />
        <StatCard label="Granted" value={result.keys.length} />
        <StatCard label="Steps" value={result.steps.length} />
        <StatCard label="Admin bypass" value={result.hasAdmin ? "Yes" : "No"} />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
        <div className="space-y-3 sm:space-y-4 xl:col-span-2">
          <ToolSection
            title="Base roles"
            description="@everyone + member roles are OR’d together"
            action={
              <Button size="sm" variant="secondary" onClick={() => setState(createDefaultEffectiveState())}>
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            }
          >
            <div className="rounded-lg border border-[var(--nx-border)] p-3 space-y-2 mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--nx-text-muted)]">
                @everyone
              </p>
              <FieldLabel>Permissions integer</FieldLabel>
              <Input
                value={state.everyone.permissions}
                onChange={(e) =>
                  update({
                    everyone: {
                      ...state.everyone,
                      permissions: e.target.value.replace(/[^\d]/g, ""),
                    },
                  })
                }
                className="font-mono text-xs"
                placeholder="0"
              />
            </div>

            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Member roles</FieldLabel>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  update({
                    roles: [
                      ...state.roles,
                      {
                        ...emptyLayer("role"),
                        label: `Role ${state.roles.length + 1}`,
                      },
                    ],
                  })
                }
              >
                <Plus className="w-3.5 h-3.5" /> Role
              </Button>
            </div>

            <div className="space-y-2">
              {state.roles.map((role, index) => (
                <div key={role.id} className="rounded-lg border border-[var(--nx-border)] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          roles: state.roles.map((r, i) =>
                            i === index ? { ...r, enabled: !r.enabled } : r
                          ),
                        })
                      }
                      className={cn("nx-selectable py-1.5 px-2", role.enabled && "nx-selectable-active")}
                    >
                      <CheckboxIndicator checked={role.enabled} />
                    </button>
                    <Input
                      value={role.label}
                      onChange={(e) =>
                        update({
                          roles: state.roles.map((r, i) =>
                            i === index ? { ...r, label: e.target.value } : r
                          ),
                        })
                      }
                      className="text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        update({ roles: state.roles.filter((_, i) => i !== index) })
                      }
                      className="p-2 rounded-md text-[var(--nx-red)] hover:bg-[var(--nx-red-soft)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Input
                    value={role.permissions}
                    onChange={(e) =>
                      update({
                        roles: state.roles.map((r, i) =>
                          i === index
                            ? { ...r, permissions: e.target.value.replace(/[^\d]/g, "") }
                            : r
                        ),
                      })
                    }
                    placeholder="Bitfield"
                    className="font-mono text-xs"
                  />
                </div>
              ))}
            </div>
          </ToolSection>

          <ToolSection title="Channel overwrites" description="Applied after role aggregation · deny then allow">
            <div className="rounded-lg border border-[var(--nx-border)] p-3 space-y-3 mb-3">
              <button
                type="button"
                onClick={() =>
                  update({
                    everyoneOverwrite: {
                      ...state.everyoneOverwrite,
                      enabled: !state.everyoneOverwrite.enabled,
                    },
                  })
                }
                className={cn(
                  "nx-selectable w-full py-2 px-3",
                  state.everyoneOverwrite.enabled && "nx-selectable-active"
                )}
              >
                <span className="flex items-center gap-2">
                  <CheckboxIndicator checked={state.everyoneOverwrite.enabled} />
                  <span className="text-xs font-semibold">@everyone overwrite</span>
                </span>
              </button>
              {state.everyoneOverwrite.enabled && (
                <PermFields
                  allow={state.everyoneOverwrite.allow}
                  deny={state.everyoneOverwrite.deny}
                  onAllow={(allow) =>
                    update({ everyoneOverwrite: { ...state.everyoneOverwrite, allow } })
                  }
                  onDeny={(deny) =>
                    update({ everyoneOverwrite: { ...state.everyoneOverwrite, deny } })
                  }
                />
              )}
            </div>

            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Role overwrites</FieldLabel>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  update({
                    roleOverwrites: [
                      ...state.roleOverwrites,
                      {
                        id: `ow_${Date.now()}`,
                        label: `Role overwrite ${state.roleOverwrites.length + 1}`,
                        allow: "0",
                        deny: "0",
                        enabled: true,
                      },
                    ],
                  })
                }
              >
                <Plus className="w-3.5 h-3.5" /> Overwrite
              </Button>
            </div>

            <div className="space-y-2 mb-3">
              {state.roleOverwrites.map((ow, index) => (
                <div key={ow.id} className="rounded-lg border border-[var(--nx-border)] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          roleOverwrites: state.roleOverwrites.map((r, i) =>
                            i === index ? { ...r, enabled: !r.enabled } : r
                          ),
                        })
                      }
                      className={cn("nx-selectable py-1.5 px-2", ow.enabled && "nx-selectable-active")}
                    >
                      <CheckboxIndicator checked={ow.enabled} />
                    </button>
                    <Input
                      value={ow.label}
                      onChange={(e) =>
                        update({
                          roleOverwrites: state.roleOverwrites.map((r, i) =>
                            i === index ? { ...r, label: e.target.value } : r
                          ),
                        })
                      }
                      className="text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          roleOverwrites: state.roleOverwrites.filter((_, i) => i !== index),
                        })
                      }
                      className="p-2 rounded-md text-[var(--nx-red)] hover:bg-[var(--nx-red-soft)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {ow.enabled && (
                    <PermFields
                      allow={ow.allow}
                      deny={ow.deny}
                      onAllow={(allow) =>
                        update({
                          roleOverwrites: state.roleOverwrites.map((r, i) =>
                            i === index ? { ...r, allow } : r
                          ),
                        })
                      }
                      onDeny={(deny) =>
                        update({
                          roleOverwrites: state.roleOverwrites.map((r, i) =>
                            i === index ? { ...r, deny } : r
                          ),
                        })
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[var(--nx-border)] p-3 space-y-3">
              <button
                type="button"
                onClick={() =>
                  update({
                    memberOverwrite: {
                      ...state.memberOverwrite,
                      enabled: !state.memberOverwrite.enabled,
                    },
                  })
                }
                className={cn(
                  "nx-selectable w-full py-2 px-3",
                  state.memberOverwrite.enabled && "nx-selectable-active"
                )}
              >
                <span className="flex items-center gap-2">
                  <CheckboxIndicator checked={state.memberOverwrite.enabled} />
                  <span className="text-xs font-semibold">Member overwrite</span>
                </span>
              </button>
              {state.memberOverwrite.enabled && (
                <PermFields
                  allow={state.memberOverwrite.allow}
                  deny={state.memberOverwrite.deny}
                  onAllow={(allow) =>
                    update({ memberOverwrite: { ...state.memberOverwrite, allow } })
                  }
                  onDeny={(deny) =>
                    update({ memberOverwrite: { ...state.memberOverwrite, deny } })
                  }
                />
              )}
            </div>
          </ToolSection>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <ToolSection title="Result" description="Final channel permissions for this member">
            <CopyField label="Effective bitfield" value={result.value} placeholder="0" />
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--nx-text-muted)] mb-2">
              Granted ({result.keys.length})
            </p>
            <div className="max-h-[240px] overflow-y-auto scrollbar-visible space-y-1">
              {result.keys.length === 0 && (
                <p className="text-xs text-[var(--nx-text-faint)]">No permissions granted.</p>
              )}
              {result.keys.map((key) => (
                <div
                  key={key}
                  className="text-xs px-2 py-1.5 rounded-md bg-[var(--nx-bg-input)] border border-[var(--nx-border)]"
                >
                  <span className="font-semibold text-[var(--nx-text-heading)]">
                    {permissions[key]?.name || key}
                  </span>
                  <span className="block font-mono text-[10px] text-[var(--nx-text-faint)]">{key}</span>
                </div>
              ))}
            </div>
          </ToolSection>

          <ToolSection title="Resolution steps" description="How the bitfield was computed">
            <ol className="space-y-2">
              {result.steps.map((step, index) => (
                <li
                  key={step.id}
                  className="rounded-lg border border-[var(--nx-border)] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--nx-text-heading)]">
                      {index + 1}. {step.label}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--nx-accent)] truncate max-w-[40%]">
                      {step.value}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--nx-text-muted)] mt-0.5">{step.detail}</p>
                </li>
              ))}
            </ol>
          </ToolSection>
        </div>
      </div>
    </ToolPanel>
  );
}
