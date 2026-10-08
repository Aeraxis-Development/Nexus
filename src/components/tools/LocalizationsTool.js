import { useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Dropdown from "../ui/Dropdown";
import ToolPanel, {
  ToolSection,
  FieldLabel,
  CopyCodeBlock,
  CopyField,
  StatGrid,
  StatCard,
} from "../ToolPanel";
import {
  DISCORD_LOCALES,
  buildLocalizationMaps,
  buildLocalizedCommand,
  createExampleLocalizations,
  emptyLocaleRow,
} from "../../lib/localizations";

export default function LocalizationsTool() {
  const [state, setState] = useState(createExampleLocalizations);
  const maps = useMemo(() => buildLocalizationMaps(state.rows), [state.rows]);
  const command = useMemo(() => buildLocalizedCommand(state), [state]);
  const commandJson = JSON.stringify(command, null, 2);
  const namesJson = JSON.stringify(maps.name_localizations, null, 2);
  const descJson = JSON.stringify(maps.description_localizations, null, 2);

  const updateRow = (index, patch) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  };

  const usedCodes = new Set(state.rows.map((r) => r.code));

  return (
    <ToolPanel fill>
      <StatGrid>
        <StatCard label="Locales" value={state.rows.length} accent />
        <StatCard label="Names" value={Object.keys(maps.name_localizations).length} />
        <StatCard label="Descriptions" value={Object.keys(maps.description_localizations).length} />
        <StatCard label="Available" value={DISCORD_LOCALES.length} />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection
          title="Localizations"
          description="Build name_localizations & description_localizations maps"
          action={
            <Button size="sm" variant="secondary" onClick={() => setState(createExampleLocalizations())}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <div>
              <FieldLabel>Default name</FieldLabel>
              <Input
                value={state.baseName}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    baseName: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32),
                  }))
                }
                placeholder="Name"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <FieldLabel>Default description</FieldLabel>
              <Input
                value={state.baseDescription}
                onChange={(e) =>
                  setState((s) => ({ ...s, baseDescription: e.target.value.slice(0, 100) }))
                }
                placeholder="Description"
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <FieldLabel>Locale rows</FieldLabel>
            <Button
              size="sm"
              variant="secondary"
              disabled={state.rows.length >= DISCORD_LOCALES.length}
              onClick={() => {
                const next = DISCORD_LOCALES.find((l) => !usedCodes.has(l.code));
                if (!next) return;
                setState((s) => ({
                  ...s,
                  rows: [...s.rows, emptyLocaleRow(next.code)],
                }));
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Locale
            </Button>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto scrollbar-visible pr-1">
            {state.rows.map((row, index) => (
              <div key={row.id} className="rounded-lg border border-[var(--nx-border)] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Dropdown
                      value={row.code}
                      onChange={(code) => updateRow(index, { code })}
                      options={DISCORD_LOCALES.map((l) => ({
                        value: l.code,
                        label: `${l.code} · ${l.label}`,
                        disabled: usedCodes.has(l.code) && l.code !== row.code,
                      }))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setState((s) => ({ ...s, rows: s.rows.filter((_, i) => i !== index) }))
                    }
                    className="p-2 rounded-md text-[var(--nx-red)] hover:bg-[var(--nx-red-soft)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Input
                  value={row.name}
                  onChange={(e) =>
                    updateRow(index, {
                      name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32),
                    })
                  }
                  placeholder="Name"
                  className="font-mono text-xs"
                />
                <Input
                  value={row.description}
                  onChange={(e) => updateRow(index, { description: e.target.value.slice(0, 100) })}
                  placeholder="Description"
                  className="text-xs"
                />
              </div>
            ))}
          </div>
        </ToolSection>

        <div className="space-y-3 sm:space-y-4">
          <CopyCodeBlock label="Command JSON" value={commandJson} />
          <ToolSection title="Maps only">
            <CopyField label="name_localizations" value={namesJson} />
            <div className="mt-3">
              <CopyField label="description_localizations" value={descJson} />
            </div>
          </ToolSection>
        </div>
      </div>
    </ToolPanel>
  );
}
