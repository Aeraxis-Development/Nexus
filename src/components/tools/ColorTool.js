import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import ColorPicker from "../ui/ColorPicker";
import ToolPanel, { ToolSection, FieldLabel, CopyField } from "../ToolPanel";
import { decimalToHex, hexToDecimal, decimalToRgb, rgbToDecimal, normalizeHex } from "../../lib/colors";

const ANGLE_PRESETS = [
  { label: "→", value: 90 },
  { label: "↘", value: 135 },
  { label: "↓", value: 180 },
  { label: "↙", value: 225 },
  { label: "←", value: 270 },
  { label: "↖", value: 315 },
  { label: "↑", value: 0 },
  { label: "↗", value: 45 },
];

function clampHexInput(val) {
  const cleaned = val.startsWith("#") ? val : `#${val}`;
  return cleaned.slice(0, 7);
}

export default function ColorTool() {
  const [decimal, setDecimal] = useState("5793266");
  const [hex, setHex] = useState("#5865f2");
  const [r, setR] = useState("88");
  const [g, setG] = useState("101");
  const [b, setB] = useState("242");

  const [primary, setPrimary] = useState("#5865f2");
  const [secondary, setSecondary] = useState("#eb459e");
  const [angle, setAngle] = useState(135);

  const syncFromDecimal = (val) => {
    setDecimal(val);
    const h = decimalToHex(val);
    if (h) setHex(h);
    const rgb = decimalToRgb(val);
    if (rgb) { setR(String(rgb.r)); setG(String(rgb.g)); setB(String(rgb.b)); }
  };

  const syncFromHex = (val) => {
    setHex(val.startsWith("#") ? val : `#${val}`);
    const d = hexToDecimal(val);
    if (d !== null) syncFromDecimal(String(d));
  };

  const syncFromRgb = (nr, ng, nb) => {
    setR(nr); setG(ng); setB(nb);
    const d = rgbToDecimal(parseInt(nr, 10), parseInt(ng, 10), parseInt(nb, 10));
    if (d !== null) {
      setDecimal(String(d));
      setHex(decimalToHex(d));
    }
  };

  const previewColor = hex || decimalToHex(decimal) || "#5865f2";

  const primaryHex = normalizeHex(primary) || "#5865f2";
  const secondaryHex = normalizeHex(secondary) || "#eb459e";
  const gradientCss = useMemo(
    () => `linear-gradient(${angle}deg, ${primaryHex}, ${secondaryHex})`,
    [angle, primaryHex, secondaryHex]
  );

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
        <div className="space-y-4">
          <ToolSection title="Decimal">
            <FieldLabel hint="Used in embed JSON as the color field">Decimal Value</FieldLabel>
            <Input
              value={decimal}
              onChange={(e) => syncFromDecimal(e.target.value.replace(/\D/g, ""))}
              className="font-mono"
              placeholder="Decimal"
            />
          </ToolSection>

          <ToolSection title="Hexadecimal">
            <FieldLabel hint="Standard web color format">Hex Value</FieldLabel>
            <div className="flex gap-2">
              <ColorPicker
                value={previewColor}
                onChange={syncFromHex}
                aria-label="Pick color"
              />
              <Input
                value={hex}
                onChange={(e) => syncFromHex(e.target.value)}
                className="font-mono flex-1"
                placeholder="#5865f2"
              />
            </div>
          </ToolSection>

          <ToolSection title="RGB">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "R", val: r, set: setR },
                { label: "G", val: g, set: setG },
                { label: "B", val: b, set: setB },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <FieldLabel>{label}</FieldLabel>
                  <Input
                    value={val}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                      const vals = { r, g, b };
                      vals[label.toLowerCase()] = v;
                      syncFromRgb(vals.r, vals.g, vals.b);
                    }}
                    className="font-mono"
                  />
                </div>
              ))}
            </div>
          </ToolSection>
        </div>

        <ToolSection title="Preview">
          <div className="space-y-4">
            <div
              className="w-full h-32 rounded-lg border border-[#3f4147]"
              style={{ backgroundColor: previewColor }}
            />
            <div className="rounded-md bg-[#1e1f22] p-4 space-y-2 font-mono text-sm">
              <p className="text-[#949ba4]">Embed JSON snippet:</p>
              <p className="text-[#5865f2]">&quot;color&quot;: {decimal || "0"}</p>
              <p className="text-[#949ba4]">CSS:</p>
              <p className="text-[#23a559]">background: {previewColor};</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { name: "Blurple", dec: "5793266", hex: "#5865f2" },
                { name: "Green", dec: "3066993", hex: "#2ecc71" },
                { name: "Red", dec: "15158332", hex: "#e74c3c" },
                { name: "Yellow", dec: "16776960", hex: "#ffff00" },
                { name: "Fuchsia", dec: "16711759", hex: "#ff009f" },
                { name: "White", dec: "16777215", hex: "#ffffff" },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => syncFromDecimal(c.dec)}
                  className="flex items-center gap-2 p-2 rounded-md border border-[#3f4147] hover:border-[#5865f2]/50 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded shrink-0" style={{ backgroundColor: c.hex }} />
                  <span className="text-xs text-[#dbdee1]">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </ToolSection>
      </div>

      <ToolSection
        title="Gradient"
        description="Build a two-stop CSS gradient from a primary and secondary color."
        className="mt-3 sm:mt-5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel hint="Start of the gradient">Primary</FieldLabel>
                <div className="flex gap-2">
                  <ColorPicker
                    value={primaryHex}
                    onChange={setPrimary}
                    aria-label="Pick primary color"
                  />
                  <Input
                    value={primary}
                    onChange={(e) => setPrimary(clampHexInput(e.target.value))}
                    className="font-mono flex-1"
                    placeholder="#5865f2"
                  />
                </div>
              </div>
              <div>
                <FieldLabel hint="End of the gradient">Secondary</FieldLabel>
                <div className="flex gap-2">
                  <ColorPicker
                    value={secondaryHex}
                    onChange={setSecondary}
                    aria-label="Pick secondary color"
                  />
                  <Input
                    value={secondary}
                    onChange={(e) => setSecondary(clampHexInput(e.target.value))}
                    className="font-mono flex-1"
                    placeholder="#eb459e"
                  />
                </div>
              </div>
            </div>

            <div>
              <FieldLabel hint="Direction of the blend">Angle</FieldLabel>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ANGLE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setAngle(preset.value)}
                    className={`w-9 h-9 rounded-md border text-sm transition-colors ${
                      angle === preset.value
                        ? "border-[#5865f2] bg-[#5865f2]/15 text-[#dbdee1]"
                        : "border-[#3f4147] text-[#949ba4] hover:border-[#5865f2]/50"
                    }`}
                    aria-label={`${preset.value} degrees`}
                    title={`${preset.value}°`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="flex-1 accent-[#5865f2]"
                  aria-label="Gradient angle"
                />
                <Input
                  value={String(angle)}
                  onChange={(e) => {
                    const next = Number(e.target.value.replace(/\D/g, "").slice(0, 3));
                    if (Number.isFinite(next)) setAngle(Math.min(360, next));
                  }}
                  className="font-mono w-20"
                  aria-label="Gradient angle degrees"
                />
                <span className="text-xs text-[#949ba4]">deg</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrimary(previewColor);
                }}
                className="text-xs px-2.5 py-1.5 rounded-md border border-[#3f4147] text-[#dbdee1] hover:border-[#5865f2]/50 transition-colors"
              >
                Use current as primary
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrimary(secondary);
                  setSecondary(primary);
                }}
                className="text-xs px-2.5 py-1.5 rounded-md border border-[#3f4147] text-[#dbdee1] hover:border-[#5865f2]/50 transition-colors"
              >
                Swap colors
              </button>
            </div>

            <CopyField label="CSS" value={`background: ${gradientCss};`} />
          </div>

          <div className="space-y-3">
            <div
              className="w-full h-40 sm:h-full min-h-[10rem] rounded-lg border border-[#3f4147]"
              style={{ background: gradientCss }}
            />
            <div className="rounded-md bg-[#1e1f22] p-4 space-y-2 font-mono text-sm">
              <p className="text-[#949ba4]">Stops:</p>
              <p className="text-[#5865f2]">{primaryHex} → {secondaryHex}</p>
              <p className="text-[#949ba4]">CSS:</p>
              <p className="text-[#23a559] break-all">{gradientCss}</p>
            </div>
          </div>
        </div>
      </ToolSection>
    </ToolPanel>
  );
}
