import { useState } from "react";
import { Input } from "../ui/input";
import DatePicker from "../ui/DatePicker";
import ToolPanel, { ToolSection, FieldLabel } from "../ToolPanel";
import { decodeSnowflake, encodeSnowflake } from "../../lib/snowflake";
import { parseLocalDatetime } from "../../lib/datetime";
function InfoRow({ label, value, mono }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-[#3f4147] last:border-0">
      <span className="text-xs font-semibold uppercase text-[#949ba4] w-36 shrink-0">{label}</span>
      <span className={mono ? "font-mono text-sm text-[#5865f2] break-all" : "text-sm text-[#f2f3f5]"}>{value}</span>
    </div>
  );
}

export default function SnowflakeTool() {
  const [id, setId] = useState("");
  const [encodeDate, setEncodeDate] = useState("");
  const decoded = decodeSnowflake(id);
  const encodeParsed = parseLocalDatetime(encodeDate);
  const encoded = encodeParsed ? encodeSnowflake(encodeParsed.getTime()) : "";
  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection title="Decode ID">
          <FieldLabel hint="User, channel, role, guild, or message ID">Snowflake ID</FieldLabel>
          <Input
            value={id}
            onChange={(e) => setId(e.target.value.replace(/\D/g, ""))}
            placeholder="Snowflake ID"
            className="font-mono"
          />
          {id && !decoded && (
            <p className="mt-2 text-sm text-[#f0b232]">Enter a valid 17–20 digit snowflake ID.</p>
          )}
          {decoded && (
            <div className="mt-4 rounded-md bg-[#1e1f22] p-4">
              <InfoRow label="Created" value={decoded.createdAt.toLocaleString()} />
              <InfoRow label="Timestamp" value={`${decoded.timestamp} ms`} mono />
              <InfoRow label="Worker ID" value={decoded.workerId} />
              <InfoRow label="Process ID" value={decoded.processId} />
              <InfoRow label="Increment" value={decoded.increment} />
              <InfoRow label="Binary" value={decoded.binary} mono />
            </div>
          )}
        </ToolSection>

        <ToolSection title="Encode Timestamp">
          <FieldLabel hint="Generate a snowflake ID from a date (worker/process = 0)">Date & Time</FieldLabel>
          <DatePicker
            value={encodeDate}
            onChange={setEncodeDate}
            placeholder="Pick date & time to encode"
          />          {encoded && (
            <div className="mt-3">
              <p className="text-xs text-[#949ba4] mb-1">Approximate Snowflake</p>
              <p className="font-mono text-lg text-[#5865f2]">{encoded}</p>
            </div>
          )}
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
