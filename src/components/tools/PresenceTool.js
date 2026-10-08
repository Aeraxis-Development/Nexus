import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CheckboxIndicator } from "../ui/checkbox";
import ToolPanel, {
  ToolSection,
  FieldLabel,
  CopyCodeBlock,
  StatGrid,
  StatCard,
} from "../ToolPanel";
import {
  ACTIVITY_TYPES,
  STATUS_OPTIONS,
  buildBotPresenceOptions,
  buildPresenceUpdate,
  createExamplePresence,
  presencePreviewLabel,
} from "../../lib/richPresence";
import { cn } from "@/lib/utils";

export default function PresenceTool() {
  const [state, setState] = useState(createExamplePresence);
  const [mode, setMode] = useState("gateway");

  const update = (patch) => setState((prev) => ({ ...prev, ...patch }));

  const payload = useMemo(
    () => (mode === "gateway" ? buildPresenceUpdate(state) : buildBotPresenceOptions(state)),
    [state, mode]
  );
  const json = JSON.stringify(payload, null, 2);
  const preview = presencePreviewLabel(state);

  return (
    <ToolPanel fill>
      <StatGrid>
        <StatCard label="Status" value={state.status} accent />
        <StatCard label="Activity" value={preview} />
        <StatCard label="Type" value={state.activityEnabled ? state.type : "—"} />
        <StatCard label="AFK" value={state.afk ? "Yes" : "No"} />
      </StatGrid>

      <div className="flex flex-wrap gap-2 mb-1">
        {[
          { id: "gateway", label: "Gateway opcode 3" },
          { id: "bot", label: "Bot presence options" },
        ].map((m) => (
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
          title="Presence"
          description="Build a status / rich presence activity payload"
          action={
            <Button size="sm" variant="secondary" onClick={() => setState(createExamplePresence())}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          }
        >
          <FieldLabel>Status</FieldLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-4">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => update({ status: s.value })}
                className={cn(
                  "nx-selectable py-2 px-2 text-center",
                  state.status === s.value && "nx-selectable-active"
                )}
              >
                <span className="text-xs font-semibold">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => update({ afk: !state.afk })}
              className={cn("nx-selectable py-2 px-3", state.afk && "nx-selectable-active")}
            >
              <span className="flex items-center gap-2">
                <CheckboxIndicator checked={state.afk} />
                <span className="text-xs font-semibold">AFK</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => update({ activityEnabled: !state.activityEnabled })}
              className={cn(
                "nx-selectable py-2 px-3",
                state.activityEnabled && "nx-selectable-active"
              )}
            >
              <span className="flex items-center gap-2">
                <CheckboxIndicator checked={state.activityEnabled} />
                <span className="text-xs font-semibold">Include activity</span>
              </span>
            </button>
          </div>

          {state.activityEnabled && (
            <div className="space-y-3">
              <FieldLabel>Activity type</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ACTIVITY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update({ type: t.value })}
                    className={cn(
                      "nx-selectable py-2 px-2 text-center",
                      state.type === t.value && "nx-selectable-active"
                    )}
                  >
                    <span className="text-xs font-semibold">{t.label}</span>
                  </button>
                ))}
              </div>

              {state.type !== 4 ? (
                <>
                  <div>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      value={state.name}
                      onChange={(e) => update({ name: e.target.value.slice(0, 128) })}
                      placeholder="Name"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <FieldLabel>State</FieldLabel>
                    <Input
                      value={state.state}
                      onChange={(e) => update({ state: e.target.value.slice(0, 128) })}
                      placeholder="State"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <FieldLabel>Details</FieldLabel>
                    <Input
                      value={state.details}
                      onChange={(e) => update({ details: e.target.value.slice(0, 128) })}
                      placeholder="Details"
                      className="text-sm"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <FieldLabel>Custom status text</FieldLabel>
                  <Input
                    value={state.state}
                    onChange={(e) => update({ state: e.target.value.slice(0, 128) })}
                    placeholder="Status"
                    className="text-sm"
                  />
                </div>
              )}

              {state.type === 1 && (
                <div>
                  <FieldLabel hint="Twitch or YouTube URL">Stream URL</FieldLabel>
                  <Input
                    value={state.url}
                    onChange={(e) => update({ url: e.target.value })}
                    placeholder="https://…"
                    className="font-mono text-xs"
                  />
                </div>
              )}

              <div>
                <FieldLabel hint="Optional — for asset keys">Application ID</FieldLabel>
                <Input
                  value={state.applicationId}
                  onChange={(e) => update({ applicationId: e.target.value.replace(/\D/g, "") })}
                  placeholder="Snowflake ID"
                  className="font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={state.largeImage}
                  onChange={(e) => update({ largeImage: e.target.value })}
                  placeholder="Large image"
                  className="font-mono text-xs"
                />
                <Input
                  value={state.largeText}
                  onChange={(e) => update({ largeText: e.target.value.slice(0, 128) })}
                  placeholder="Large text"
                  className="text-xs"
                />
                <Input
                  value={state.smallImage}
                  onChange={(e) => update({ smallImage: e.target.value })}
                  placeholder="Small image"
                  className="font-mono text-xs"
                />
                <Input
                  value={state.smallText}
                  onChange={(e) => update({ smallText: e.target.value.slice(0, 128) })}
                  placeholder="Small text"
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--nx-text-faint)] mb-1">
              Preview
            </p>
            <p className="text-sm font-semibold text-[var(--nx-text-heading)]">{preview}</p>
            <p className="text-xs text-[var(--nx-text-muted)] mt-0.5 capitalize">{state.status}</p>
          </div>
        </ToolSection>

        <CopyCodeBlock
          label={mode === "gateway" ? "Gateway payload" : "Presence options"}
          value={json}
          className="xl:sticky xl:top-0"
        />
      </div>
    </ToolPanel>
  );
}
