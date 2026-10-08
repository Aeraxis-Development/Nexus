import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ToolPanel, { ToolSection, FieldLabel } from "../ToolPanel";
import { parsePermissions, permissions } from "../../lib/permissions";
import { useNexus } from "../../context/NexusContext";

export default function PermissionDecoderTool() {
  const { setSelectedPermissions } = useNexus();
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState([]);

  const decode = () => {
    if (!input.trim()) return;
    try {
      setParsed(parsePermissions(input.trim()));
    } catch {
      setParsed([]);
    }
  };

  const applyToCalculator = () => {
    setSelectedPermissions(parsed);
  };

  return (
    <ToolPanel fill>
      <ToolSection title="Decode Value">
        <FieldLabel hint="Paste a decimal permission value from an invite URL">Permission Integer</FieldLabel>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
            placeholder="Bitfield"
            className="font-mono flex-1"
            onKeyDown={(e) => e.key === "Enter" && decode()}
          />
          <Button onClick={decode}>Decode</Button>
        </div>
      </ToolSection>

      {parsed.length > 0 && (
        <ToolSection title={`${parsed.length} Permissions Found`}>
          <div className="mb-4">
            <Button variant="secondary" size="sm" onClick={applyToCalculator}>
              Apply to Calculator
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {parsed.map((key) => {
              const perm = permissions[key];
              return (
                <div key={key} className="p-3 rounded-md border border-[#3f4147] bg-[#1e1f22]">
                  <p className="text-sm font-medium text-[#f2f3f5]">{perm?.name || key}</p>
                  <p className="text-xs font-mono text-[#949ba4] mt-0.5">{key}</p>
                </div>
              );
            })}
          </div>
        </ToolSection>
      )}

      {input && parsed.length === 0 && (
        <p className="text-sm text-[#949ba4]">Click Decode to parse the value, or enter a valid permission integer.</p>
      )}
    </ToolPanel>
  );
}
