import { useMemo, useState } from "react";
import { RotateCcw, Upload, List, Trash } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ToolPanel, {
  ToolSection,
  FieldLabel,
  CopyCodeBlock,
  StatGrid,
  StatCard,
} from "../ToolPanel";
import BotGuildPanel, { BotActionResult } from "../BotGuildPanel";
import {
  ENTITY_TYPES,
  buildScheduledEvent,
  createExampleEvent,
} from "../../lib/scheduledEvents";
import { cn } from "@/lib/utils";

const VOICE_STAGE_TYPES = [2, 13]; // GUILD_VOICE, GUILD_STAGE_VOICE

export default function ScheduledEventTool() {
  const [state, setState] = useState(createExampleEvent);
  const [guildId, setGuildId] = useState("");
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const [listed, setListed] = useState([]);

  const event = useMemo(() => buildScheduledEvent(state), [state]);
  const json = JSON.stringify(event, null, 2);

  const update = (patch) => setState((prev) => ({ ...prev, ...patch }));
  const isExternal = Number(state.entityType) === 3;
  const needsChannel = !isExternal;

  const createEvent = async ({ botReady, channelId }) => {
    if (!botReady) return;
    const payload = { ...event };
    if (needsChannel) {
      if (!channelId && !state.channelId) {
        setResult({ ok: false, msg: "Pick a stage or voice channel." });
        return;
      }
      payload.channel_id = channelId || state.channelId;
    }

    setBusy("create");
    setResult(null);
    try {
      const res = await fetch("/api/scheduled-events", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          ok: false,
          msg: data.error || "Failed to create event.",
          inviteUrl: data.inviteUrl,
        });
        return;
      }
      setResult({ ok: true, msg: `Created “${data.name || state.name}” (${data.id}).` });
      setListed((prev) => [data, ...prev.filter((e) => e.id !== data.id)]);
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const listEvents = async ({ botReady }) => {
    if (!botReady && needsChannel) return;
    // For list we only need guild + bot, not channel
    if (!guildId) return;
    setBusy("list");
    setResult(null);
    try {
      const res = await fetch(
        `/api/scheduled-events?guildId=${encodeURIComponent(guildId)}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) {
        setResult({
          ok: false,
          msg: data.error || "Failed to list events.",
          inviteUrl: data.inviteUrl,
        });
        return;
      }
      setListed(data.events || []);
      setResult({ ok: true, msg: `Loaded ${(data.events || []).length} event(s).` });
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const deleteEvent = async (eventId, { botReady }) => {
    if (!botReady) return;
    setBusy(`delete:${eventId}`);
    setResult(null);
    try {
      const res = await fetch("/api/scheduled-events", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, eventId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, msg: data.error || "Failed to delete event." });
        return;
      }
      setListed((prev) => prev.filter((e) => e.id !== eventId));
      setResult({ ok: true, msg: "Event deleted." });
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <ToolPanel fill>
      <StatGrid>
        <StatCard
          label="Entity"
          value={ENTITY_TYPES.find((e) => e.value === Number(state.entityType))?.label || "—"}
          accent
        />
        <StatCard label="Privacy" value="Guild only" />
        <StatCard label="Name length" value={(state.name || "").length} />
        <StatCard label="JSON chars" value={json.length} />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection
          title="Scheduled event"
          description="Build POST /guilds/{guild.id}/scheduled-events body"
          action={
            <Button size="sm" variant="secondary" onClick={() => setState(createExampleEvent())}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          }
        >
          <FieldLabel>Name</FieldLabel>
          <Input
            value={state.name}
            onChange={(e) => update({ name: e.target.value.slice(0, 100) })}
            placeholder="Event name"
            className="text-sm mb-4"
          />

          <FieldLabel>Description</FieldLabel>
          <textarea
            value={state.description}
            onChange={(e) => update({ description: e.target.value.slice(0, 1000) })}
            placeholder="Description"
            className="nx-input min-h-[88px] py-2.5 text-sm resize-y w-full mb-4"
          />

          <FieldLabel>Entity type</FieldLabel>
          <div className="grid sm:grid-cols-3 gap-1.5 mb-4">
            {ENTITY_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ entityType: t.value })}
                className={cn(
                  "nx-selectable text-left py-2 px-3",
                  Number(state.entityType) === t.value && "nx-selectable-active"
                )}
              >
                <span className="block text-[13px] font-semibold">{t.label}</span>
                <span className="block text-[11px] text-[var(--nx-text-muted)]">{t.description}</span>
              </button>
            ))}
          </div>

          {!isExternal ? (
            <div className="mb-4">
              <FieldLabel hint="Or pick from the deploy panel">Channel ID</FieldLabel>
              <Input
                value={state.channelId}
                onChange={(e) => update({ channelId: e.target.value.replace(/\D/g, "") })}
                placeholder="Channel ID"
                className="font-mono text-sm"
              />
            </div>
          ) : (
            <div className="mb-4">
              <FieldLabel>Location</FieldLabel>
              <Input
                value={state.entityMetadataLocation}
                onChange={(e) => update({ entityMetadataLocation: e.target.value.slice(0, 100) })}
                placeholder="Location"
                className="text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <FieldLabel>Start</FieldLabel>
              <Input
                type="datetime-local"
                value={state.scheduledStartTime}
                onChange={(e) => update({ scheduledStartTime: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <FieldLabel hint={isExternal ? "Required for external" : "Optional"}>End</FieldLabel>
              <Input
                type="datetime-local"
                value={state.scheduledEndTime}
                onChange={(e) => update({ scheduledEndTime: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          <FieldLabel hint="Optional data URI image for cover">Image</FieldLabel>
          <Input
            value={state.image}
            onChange={(e) => update({ image: e.target.value })}
            placeholder="https://…"
            className="font-mono text-xs"
          />
        </ToolSection>

        <div className="space-y-3 sm:space-y-4">
          <CopyCodeBlock
            label="Event JSON"
            value={json}
            emptyHint="Configure the event to generate paste-ready JSON."
          />
          <BotGuildPanel
            title="Create with bot"
            description="Create or list guild scheduled events"
            guildId={guildId}
            onGuildIdChange={setGuildId}
            showChannels={needsChannel}
            channelTypes={VOICE_STAGE_TYPES}
            channelId={state.channelId}
            onChannelIdChange={(id) => update({ channelId: id })}
            channelLabel="Stage / voice channel"
          >
            {({ botReady, guildReady, channelId }) => {
              const canList = guildReady;
              const canCreate =
                (isExternal ? guildReady : botReady) &&
                (isExternal || Boolean(channelId || state.channelId));
              return (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!canCreate || busy}
                      onClick={() => createEvent({ botReady: canCreate, channelId })}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {busy === "create" ? "Creating..." : "Create event"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={!canList || busy}
                      onClick={() => listEvents({ botReady: canList })}
                    >
                      <List className="w-3.5 h-3.5" />
                      {busy === "list" ? "Loading..." : "List events"}
                    </Button>
                  </div>
                  <BotActionResult result={result} />
                  {listed.length > 0 && (
                    <ul className="space-y-1.5">
                      {listed.map((ev) => (
                        <li
                          key={ev.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-[var(--nx-border)] px-3 py-2 text-xs"
                        >
                          <span className="truncate">
                            {ev.name || "Event"}
                            <span className="text-[var(--nx-text-faint)] font-mono">
                              {" "}
                              · {ev.id}
                            </span>
                          </span>
                          <button
                            type="button"
                            className="text-[var(--nx-red)] hover:underline shrink-0"
                            disabled={!guildReady || busy}
                            onClick={() => deleteEvent(ev.id, { botReady: guildReady })}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }}
          </BotGuildPanel>
        </div>
      </div>
    </ToolPanel>
  );
}
