import { useState, useEffect } from "react";
import DatePicker from "../ui/DatePicker";
import { Input } from "../ui/input";
import ToolPanel, { ToolSection, FieldLabel, CopyField } from "../ToolPanel";
import { parseLocalDatetime, toLocalDatetimeString } from "../../lib/datetime";

const FORMATS = [
  { id: "f", label: "Short Time", example: "9:41 PM" },
  { id: "F", label: "Long Date/Time", example: "Tuesday, June 23, 2026 9:41 PM" },
  { id: "d", label: "Short Date", example: "06/23/2026" },
  { id: "D", label: "Long Date", example: "June 23, 2026" },
  { id: "t", label: "Short Time (alt)", example: "9:41 PM" },
  { id: "T", label: "Long Time", example: "9:41:00 PM" },
  { id: "R", label: "Relative", example: "in 2 hours" },
];

function toUnix(dateStr) {
  const d = parseLocalDatetime(dateStr);
  if (!d) return null;
  return Math.floor(d.getTime() / 1000);
}

export default function TimestampTool() {
  const [datetime, setDatetime] = useState("");
  const [unix, setUnix] = useState(null);

  useEffect(() => {
    setUnix(toUnix(datetime));
  }, [datetime]);

  const now = Math.floor(Date.now() / 1000);

  const presets = [
    { label: "Now", fn: () => toLocalDatetimeString(new Date()) },
    {
      label: "+1 Hour",
      fn: () => {
        const d = new Date();
        d.setHours(d.getHours() + 1);
        return toLocalDatetimeString(d);
      },
    },
    {
      label: "+1 Day",
      fn: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return toLocalDatetimeString(d);
      },
    },
  ];

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
        <ToolSection title="Pick a Date" className="xl:col-span-1">
          <FieldLabel hint="Timestamps are stored as Unix seconds">Date & Time</FieldLabel>
          <DatePicker value={datetime} onChange={setDatetime} />

          <div className="flex flex-wrap gap-2 mt-3">
            {presets.map(({ label, fn }) => (
              <button
                key={label}
                type="button"
                onClick={() => setDatetime(fn())}
                className="text-xs px-3 py-1.5 rounded-lg bg-[var(--nx-bg-overlay)] hover:bg-[var(--nx-bg-raised)] text-[var(--nx-text)] border border-[var(--nx-border)] transition-colors font-medium"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-[var(--nx-border)]">
            <FieldLabel hint="Raw Unix timestamp in seconds">Manual Unix Input</FieldLabel>
            <Input
              value={unix ?? ""}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) {
                  setUnix(v);
                  setDatetime(toLocalDatetimeString(new Date(v * 1000)));
                }
              }}
              className="font-mono"
              placeholder="Unix time"
            />
            <p className="mt-2 text-xs text-[var(--nx-text-muted)]">
              Current: <span className="font-mono text-[var(--nx-accent)]">{now}</span>
            </p>
          </div>
        </ToolSection>

        {unix ? (
          <ToolSection title="Generated Timestamps" className="xl:col-span-2" fill>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FORMATS.map(({ id, label, example }) => {
                const markdown = `<t:${unix}:${id}>`;
                return (
                  <div key={id} className="p-3 rounded-lg bg-[var(--nx-bg-input)] border border-[var(--nx-border)]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-[var(--nx-text-heading)]">{label}</span>
                      <span className="text-[10px] font-mono text-[var(--nx-text-muted)] bg-[var(--nx-bg-overlay)] px-1.5 py-0.5 rounded">
                        :{id}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--nx-text-muted)] mb-2">{example}</p>
                    <CopyField value={markdown} />
                  </div>
                );
              })}
            </div>
          </ToolSection>
        ) : (
          <ToolSection title="Format Reference" className="xl:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--nx-text-muted)] text-xs uppercase">
                    <th className="pb-2 pr-4">Style</th>
                    <th className="pb-2 pr-4">Format</th>
                    <th className="pb-2">Example Output</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--nx-text)]">
                  {FORMATS.map(({ id, label, example }) => (
                    <tr key={id} className="border-t border-[var(--nx-border)]">
                      <td className="py-2 pr-4 font-mono text-[var(--nx-accent)]">{id}</td>
                      <td className="py-2 pr-4">{label}</td>
                      <td className="py-2 text-[var(--nx-text-muted)]">{example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ToolSection>
        )}
      </div>
    </ToolPanel>
  );
}
