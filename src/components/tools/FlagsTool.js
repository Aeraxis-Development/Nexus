import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CheckboxIndicator } from "../ui/checkbox";
import ToolPanel, { ToolSection, StatGrid, StatCard, CopyField, FieldLabel } from "../ToolPanel";
import {
  applicationFlags,
  combineFlags,
  parseFlags,
  userFlags,
} from "../../lib/flags";
import { messageFlags } from "../../lib/messageFlags";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "user", label: "User flags", map: userFlags },
  { id: "application", label: "Application flags", map: applicationFlags },
  { id: "message", label: "Message flags", map: messageFlags },
];

export default function FlagsTool() {
  const [tab, setTab] = useState("user");
  const [selected, setSelected] = useState([]);
  const [decodeInput, setDecodeInput] = useState("");

  const flagMap = TABS.find((t) => t.id === tab)?.map || userFlags;
  const value = combineFlags(selected, flagMap).toString();
  const decoded = useMemo(() => {
    if (!decodeInput.trim()) return null;
    try {
      return parseFlags(decodeInput.trim(), flagMap);
    } catch {
      return [];
    }
  }, [decodeInput, flagMap]);

  const toggle = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const switchTab = (id) => {
    setTab(id);
    setSelected([]);
    setDecodeInput("");
  };

  const applyDecoded = () => {
    if (!decoded) return;
    setSelected(decoded.map((f) => f.key));
  };

  const entries = Object.entries(flagMap);

  return (
    <ToolPanel fill>
      <div className="flex flex-wrap gap-2 mb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
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

      <StatGrid>
        <StatCard label="Bitfield" value={value} accent mono />
        <StatCard label="Selected" value={selected.length} />
        <StatCard label="Available" value={entries.length} />
        <StatCard
          label="Privileged"
          value={selected.filter((k) => flagMap[k]?.privileged).length}
        />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
        <ToolSection title="Decode" description="Paste a public_flags / flags integer" className="xl:col-span-1">
          <FieldLabel>Flags integer</FieldLabel>
          <Input
            value={decodeInput}
            onChange={(e) => setDecodeInput(e.target.value)}
            placeholder="Bitfield"
            className="font-mono text-sm"
          />
          {decoded && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-[var(--nx-text-muted)]">
                {decoded.length} flag{decoded.length === 1 ? "" : "s"} matched
              </p>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-visible">
                {decoded.map((f) => (
                  <li key={f.key} className="text-xs text-[var(--nx-text)] font-medium">
                    {f.name}
                  </li>
                ))}
                {decoded.length === 0 && (
                  <li className="text-xs text-[var(--nx-text-faint)]">No known flags in this value.</li>
                )}
              </ul>
              <Button size="sm" variant="secondary" onClick={applyDecoded} disabled={!decoded.length}>
                Apply to calculator
              </Button>
            </div>
          )}
          <div className="mt-5 pt-5 border-t border-[var(--nx-border)]">
            <CopyField label="Result bitfield" value={value} placeholder="0" />
          </div>
        </ToolSection>

        <ToolSection
          title="Calculator"
          description="Toggle flags to build a bitfield"
          className="xl:col-span-2"
          action={
            <Button
              size="sm"
              variant={selected.length ? "destructive" : "secondary"}
              onClick={() => setSelected(selected.length ? [] : entries.map(([k]) => k))}
            >
              {selected.length === entries.length ? "Clear" : selected.length ? "Clear" : "Select all"}
            </Button>
          }
        >
          <div className="grid sm:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto scrollbar-visible pr-1">
            {entries.map(([key, flag]) => {
              const active = selected.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={cn("nx-selectable flex items-start gap-3", active && "nx-selectable-active")}
                >
                  <CheckboxIndicator checked={active} className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--nx-text-heading)]">{flag.name}</span>
                      {flag.privileged && <span className="nx-badge">Privileged</span>}
                    </span>
                    <span className="block text-xs text-[var(--nx-text-muted)] mt-0.5 leading-relaxed">
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
    </ToolPanel>
  );
}
