import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ToolPanel, { ToolSection, FieldLabel } from "../ToolPanel";
import { cn } from "@/lib/utils";

const STYLES = [
  { id: "ping", label: "Ping badge", description: "Red unread count" },
  { id: "dot", label: "Notification dot", description: "Simple red dot" },
  { id: "mention", label: "Mention pill", description: "@-style chip" },
];

export default function FakePingTool() {
  const canvasRef = useRef(null);
  const [style, setStyle] = useState("ping");
  const [count, setCount] = useState("3");
  const [label, setLabel] = useState("@everyone");
  const [size, setSize] = useState(128);

  const paint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = Math.max(32, Math.min(512, Number(size) || 128));
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, s, s);

    if (style === "dot") {
      const r = s * 0.28;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, r, 0, Math.PI * 2);
      ctx.fillStyle = "#ed4245";
      ctx.fill();
      // Discord-ish white ring
      ctx.lineWidth = Math.max(2, s * 0.06);
      ctx.strokeStyle = "#313338";
      ctx.stroke();
      return;
    }

    if (style === "mention") {
      const text = label || "@mention";
      ctx.font = `700 ${Math.floor(s * 0.22)}px gg sans, Whitney, Helvetica, Arial, sans-serif`;
      const tw = ctx.measureText(text).width;
      const padX = s * 0.12;
      const h = s * 0.42;
      const w = Math.min(s * 0.92, tw + padX * 2);
      const x = (s - w) / 2;
      const y = (s - h) / 2;
      const r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fillStyle = "rgba(88, 101, 242, 0.3)";
      ctx.fill();
      ctx.fillStyle = "#dee0fc";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, s / 2, s / 2 + 1);
      return;
    }

    // ping badge
    const text = String(count || "1");
    ctx.font = `700 ${Math.floor(s * 0.42)}px gg sans, Whitney, Helvetica, Arial, sans-serif`;
    const tw = ctx.measureText(text).width;
    const h = s * 0.55;
    const w = Math.max(h, tw + s * 0.28);
    const x = (s - w) / 2;
    const y = (s - h) / 2;
    const r = h / 2;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = "#ed4245";
    ctx.fill();

    // subtle border like Discord app icon badge
    ctx.lineWidth = Math.max(2, s * 0.04);
    ctx.strokeStyle = "#313338";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, s / 2, s / 2 + s * 0.02);
  };

  useEffect(() => {
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, count, label, size]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `discord-${style}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection title="Badge" description="Discord-style notification badges for memes and mockups">
          <FieldLabel>Style</FieldLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={cn("nx-selectable py-2 px-3 text-left", style === s.id && "nx-selectable-active")}
              >
                <span className="block text-xs font-semibold text-[var(--nx-text-heading)]">{s.label}</span>
                <span className="block text-[10px] text-[var(--nx-text-faint)] mt-0.5">{s.description}</span>
              </button>
            ))}
          </div>

          {style === "ping" && (
            <>
              <FieldLabel hint="Use 9+ for overflow style">Count</FieldLabel>
              <Input
                value={count}
                onChange={(e) => setCount(e.target.value.slice(0, 4))}
                className="mb-3 font-mono"
                placeholder="1"
              />
            </>
          )}

          {style === "mention" && (
            <>
              <FieldLabel>Label</FieldLabel>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className="mb-3" maxLength={24} />
            </>
          )}

          <FieldLabel hint="Output canvas size">Size (px)</FieldLabel>
          <Input
            type="number"
            min={32}
            max={512}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="font-mono"
          />
        </ToolSection>

        <ToolSection
          title="Preview"
          description="Transparent PNG download"
          action={
            <Button type="button" size="sm" onClick={download}>
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
          }
        >
          <div
            className="flex items-center justify-center min-h-[220px] rounded-xl border border-[var(--nx-border)]"
            style={{
              background:
                "repeating-conic-gradient(#1e1f22 0% 25%, #2b2d31 0% 50%) 50% / 20px 20px",
            }}
          >
            <canvas ref={canvasRef} className="max-w-[70%] h-auto" />
          </div>
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
