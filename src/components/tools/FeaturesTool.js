import { useMemo, useState } from "react";
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
import {
  GUILD_FEATURES,
  describeFeatures,
  parseFeatureList,
} from "../../lib/guildFeatures";
import {
  combineFlags,
  parseFlags,
} from "../../lib/flags";
import { systemChannelFlags } from "../../lib/messageFlags";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "features", label: "Guild features" },
  { id: "system", label: "System channel flags" },
];

export default function FeaturesTool() {
  const [tab, setTab] = useState("features");
  const [selected, setSelected] = useState([]);
  const [decodeInput, setDecodeInput] = useState("");
  const [sysSelected, setSysSelected] = useState([]);
  const [sysDecode, setSysDecode] = useState("");

  const featureJson = useMemo(
    () => JSON.stringify(selected, null, 2),
    [selected]
  );

  const decodedFeatures = useMemo(() => {
    if (!decodeInput.trim()) return null;
    return describeFeatures(parseFeatureList(decodeInput));
  }, [decodeInput]);

  const sysValue = combineFlags(sysSelected, systemChannelFlags).toString();
  const sysDecoded = useMemo(() => {
    if (!sysDecode.trim()) return null;
    try {
      return parseFlags(sysDecode.trim(), systemChannelFlags);
    } catch {
      return [];
    }
  }, [sysDecode]);

  const toggleFeature = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSys = (key) => {
    setSysSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <ToolPanel fill>
      <div className="flex flex-wrap gap-2 mb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
              tab === t.id
                ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)] text-[var(--nx-text-heading)]"
                : "border-[var(--nx-border)] text-[var(--nx-text-muted)] hover:bg-[var(--nx-hover-bg)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "features" ? (
        <>
          <StatGrid>
            <StatCard label="Selected" value={selected.length} accent />
            <StatCard label="Known" value={GUILD_FEATURES.length} />
            <StatCard
              label="Unknown in paste"
              value={
                decodedFeatures
                  ? decodedFeatures.filter((f) => !GUILD_FEATURES.some((g) => g.id === f.id)).length
                  : 0
              }
            />
            <StatCard label="JSON length" value={featureJson.length} />
          </StatGrid>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
            <ToolSection title="Parse" description="Paste a features array or comma-separated list">
              <FieldLabel>Features</FieldLabel>
              <textarea
                value={decodeInput}
                onChange={(e) => setDecodeInput(e.target.value)}
                placeholder="COMMUNITY, VERIFIED"
                className="nx-input font-mono text-xs min-h-[120px] py-2.5 resize-y w-full"
              />
              {decodedFeatures && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-[var(--nx-text-muted)]">
                    {decodedFeatures.length} feature{decodedFeatures.length === 1 ? "" : "s"}
                  </p>
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-visible">
                    {decodedFeatures.map((f) => (
                      <li key={f.id} className="text-xs">
                        <span className="font-semibold text-[var(--nx-text-heading)]">{f.name}</span>
                        <span className="block font-mono text-[10px] text-[var(--nx-text-faint)]">{f.id}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelected(decodedFeatures.map((f) => f.id))}
                  >
                    Apply to list
                  </Button>
                </div>
              )}
              <div className="mt-5 pt-5 border-t border-[var(--nx-border)]">
                <CopyField label="features JSON" value={featureJson} placeholder="[]" />
              </div>
            </ToolSection>

            <ToolSection
              title="Features"
              description="Toggle known guild feature flags"
              className="xl:col-span-2"
              action={
                <Button
                  size="sm"
                  variant={selected.length ? "destructive" : "secondary"}
                  onClick={() =>
                    setSelected(selected.length ? [] : GUILD_FEATURES.map((f) => f.id))
                  }
                >
                  {selected.length ? "Clear" : "Select all"}
                </Button>
              }
            >
              <div className="grid sm:grid-cols-2 gap-2 max-h-[520px] overflow-y-auto scrollbar-visible pr-1">
                {GUILD_FEATURES.map((feature) => {
                  const active = selected.includes(feature.id);
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => toggleFeature(feature.id)}
                      className={cn("nx-selectable flex items-start gap-3", active && "nx-selectable-active")}
                    >
                      <CheckboxIndicator checked={active} className="mt-0.5" />
                      <span className="min-w-0">
                        <span className="text-sm font-semibold text-[var(--nx-text-heading)]">
                          {feature.name}
                        </span>
                        <span className="block text-xs text-[var(--nx-text-muted)] mt-0.5 leading-relaxed">
                          {feature.description}
                        </span>
                        <span className="block text-[10px] font-mono text-[var(--nx-text-faint)] mt-1">
                          {feature.id}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </ToolSection>
          </div>
        </>
      ) : (
        <>
          <StatGrid>
            <StatCard label="Bitfield" value={sysValue} accent mono />
            <StatCard label="Selected" value={sysSelected.length} />
            <StatCard label="Available" value={Object.keys(systemChannelFlags).length} />
            <StatCard
              label="Suppressed"
              value={sysSelected.filter((k) => k.startsWith("SUPPRESS")).length}
            />
          </StatGrid>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
            <ToolSection title="Decode" description="Paste a system_channel_flags integer">
              <FieldLabel>Flags integer</FieldLabel>
              <Input
                value={sysDecode}
                onChange={(e) => setSysDecode(e.target.value)}
                placeholder="Bitfield"
                className="font-mono text-sm"
              />
              {sysDecoded && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-[var(--nx-text-muted)]">
                    {sysDecoded.length} flag{sysDecoded.length === 1 ? "" : "s"}
                  </p>
                  <ul className="space-y-1.5">
                    {sysDecoded.map((f) => (
                      <li key={f.key} className="text-xs font-medium text-[var(--nx-text)]">
                        {f.name}
                      </li>
                    ))}
                    {sysDecoded.length === 0 && (
                      <li className="text-xs text-[var(--nx-text-faint)]">No known flags.</li>
                    )}
                  </ul>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!sysDecoded.length}
                    onClick={() => setSysSelected(sysDecoded.map((f) => f.key))}
                  >
                    Apply to calculator
                  </Button>
                </div>
              )}
              <div className="mt-5 pt-5 border-t border-[var(--nx-border)]">
                <CopyField label="Result bitfield" value={sysValue} placeholder="0" />
              </div>
            </ToolSection>

            <ToolSection
              title="Calculator"
              description="Toggle system channel notification flags"
              className="xl:col-span-2"
              action={
                <Button
                  size="sm"
                  variant={sysSelected.length ? "destructive" : "secondary"}
                  onClick={() =>
                    setSysSelected(
                      sysSelected.length ? [] : Object.keys(systemChannelFlags)
                    )
                  }
                >
                  {sysSelected.length ? "Clear" : "Select all"}
                </Button>
              }
            >
              <div className="grid sm:grid-cols-2 gap-2">
                {Object.entries(systemChannelFlags).map(([key, flag]) => {
                  const active = sysSelected.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSys(key)}
                      className={cn("nx-selectable flex items-start gap-3", active && "nx-selectable-active")}
                    >
                      <CheckboxIndicator checked={active} className="mt-0.5" />
                      <span className="min-w-0">
                        <span className="text-sm font-semibold text-[var(--nx-text-heading)]">
                          {flag.name}
                        </span>
                        <span className="block text-xs text-[var(--nx-text-muted)] mt-0.5">
                          {flag.description}
                        </span>
                        <span className="block text-[10px] font-mono text-[var(--nx-text-faint)] mt-1">
                          {key} · {flag.value.toString()}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </ToolSection>
          </div>
        </>
      )}
    </ToolPanel>
  );
}
