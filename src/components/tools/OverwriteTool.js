import { useMemo, useState } from "react";
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
import { permissions, permissionsCategories } from "../../lib/permissions";
import {
  OVERWRITE_TYPES,
  bitfieldsFromState,
  buildOverwriteJson,
  emptyOverwriteState,
  stateFromBitfields,
} from "../../lib/overwrites";
import { cn } from "@/lib/utils";

const MODE_CYCLE = { neutral: "allow", allow: "deny", deny: "neutral" };
const MODE_LABEL = { neutral: "—", allow: "Allow", deny: "Deny" };
const MODE_CLASS = {
  neutral: "border-[var(--nx-border)] text-[var(--nx-text-faint)]",
  allow: "border-[var(--nx-green)]/40 bg-[var(--nx-green-soft)] text-[var(--nx-green)]",
  deny: "border-[var(--nx-red)]/40 bg-[var(--nx-red-soft)] text-[var(--nx-red)]",
};

export default function OverwriteTool() {
  const [targetId, setTargetId] = useState("");
  const [type, setType] = useState(0);
  const [state, setState] = useState(emptyOverwriteState);
  const [decodeAllow, setDecodeAllow] = useState("");
  const [decodeDeny, setDecodeDeny] = useState("");

  const { allow, deny, allowKeys, denyKeys } = useMemo(
    () => bitfieldsFromState(state),
    [state]
  );

  const json = useMemo(
    () => JSON.stringify(buildOverwriteJson({ id: targetId, type, state }), null, 2),
    [targetId, type, state]
  );

  const cycle = (key) => {
    setState((prev) => ({ ...prev, [key]: MODE_CYCLE[prev[key] || "neutral"] }));
  };

  const clearAll = () => setState(emptyOverwriteState());

  const applyDecoded = () => {
    setState(stateFromBitfields(decodeAllow || "0", decodeDeny || "0"));
  };

  const setCategory = (keys, mode) => {
    setState((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        next[k] = mode;
      });
      return next;
    });
  };

  return (
    <ToolPanel fill>
      <StatGrid>
        <StatCard label="Allow" value={allow} accent mono />
        <StatCard label="Deny" value={deny} mono />
        <StatCard label="Allowed" value={allowKeys.length} />
        <StatCard label="Denied" value={denyKeys.length} />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
        <div className="space-y-3 sm:space-y-4">
          <ToolSection title="Target" description="Role or member overwrite">
            <FieldLabel>Type</FieldLabel>
            <Dropdown
              value={type}
              onChange={(v) => setType(Number(v))}
              options={OVERWRITE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
            <div className="mt-4">
              <FieldLabel hint="Role ID or user ID">Snowflake ID</FieldLabel>
              <Input
                value={targetId}
                onChange={(e) => setTargetId(e.target.value.replace(/\D/g, ""))}
                placeholder="Snowflake ID"
                className="font-mono text-sm"
              />
            </div>
            <div className="mt-5 pt-5 border-t border-[var(--nx-border)] space-y-3">
              <CopyField label="Allow bitfield" value={allow} placeholder="0" />
              <CopyField label="Deny bitfield" value={deny} placeholder="0" />
            </div>
          </ToolSection>

          <ToolSection title="Decode" description="Paste allow / deny integers">
            <FieldLabel>Allow</FieldLabel>
            <Input
              value={decodeAllow}
              onChange={(e) => setDecodeAllow(e.target.value)}
              placeholder="0"
              className="font-mono text-sm mb-3"
            />
            <FieldLabel>Deny</FieldLabel>
            <Input
              value={decodeDeny}
              onChange={(e) => setDecodeDeny(e.target.value)}
              placeholder="0"
              className="font-mono text-sm"
            />
            <Button size="sm" variant="secondary" className="mt-3" onClick={applyDecoded}>
              Apply to calculator
            </Button>
          </ToolSection>
        </div>

        <ToolSection
          title="Permissions"
          description="Click to cycle Neutral → Allow → Deny"
          className="xl:col-span-2"
          action={
            <Button size="sm" variant="destructive" onClick={clearAll}>
              Clear
            </Button>
          }
        >
          <div className="space-y-5">
            {Object.entries(permissionsCategories).map(([catKey, category]) => (
              <div key={catKey}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--nx-text-muted)]">
                    {category.name}
                  </h4>
                  <div className="flex gap-1">
                    {["allow", "deny", "neutral"].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setCategory(category.permissions, mode)}
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-md border capitalize",
                          MODE_CLASS[mode]
                        )}
                      >
                        {MODE_LABEL[mode]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {category.permissions.map((key) => {
                    const perm = permissions[key];
                    const mode = state[key] || "neutral";
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => cycle(key)}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                          MODE_CLASS[mode]
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-[var(--nx-text-heading)] truncate">
                            {perm.name}
                          </span>
                          <span className="block text-[10px] font-mono text-[var(--nx-text-faint)] mt-0.5">
                            {key}
                          </span>
                        </span>
                        <span className="text-[11px] font-bold uppercase shrink-0 w-12 text-right">
                          {MODE_LABEL[mode]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ToolSection>
      </div>

      <CopyCodeBlock
        label="Overwrite JSON"
        value={json}
        emptyHint="Configure allow/deny flags to generate overwrite JSON."
      />
    </ToolPanel>
  );
}
