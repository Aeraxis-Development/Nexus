import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ColorPicker from "../ui/ColorPicker";
import ToolPanel, { ToolSection, FieldLabel } from "../ToolPanel";

const DEFAULT_AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect fill="#5865f2" width="128" height="128"/><text x="64" y="76" text-anchor="middle" font-size="48" fill="#fff" font-family="sans-serif">N</text></svg>`
  );

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export default function FakeMessageTool() {
  const canvasRef = useRef(null);
  const [username, setUsername] = useState("Nexus");
  const [content, setContent] = useState("this looks suspiciously real");
  const [timestamp, setTimestamp] = useState("Today at 9:41 PM");
  const [nameColor, setNameColor] = useState("#ed4245");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bot, setBot] = useState(false);

  const render = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = 720;
    const pad = 20;
    const avatarSize = 40;
    const left = pad + avatarSize + 16;
    const maxText = width - left - pad;

    ctx.font = "400 16px gg sans, Whitney, 'Helvetica Neue', Helvetica, Arial, sans-serif";
    const lines = wrapText(ctx, content, maxText);
    const height = Math.max(88, pad * 2 + 22 + lines.length * 22 + 8);

    canvas.width = width;
    canvas.height = height;

    // Discord dark theme message row
    ctx.fillStyle = "#313338";
    ctx.fillRect(0, 0, width, height);

    // Hover-ish strip
    ctx.fillStyle = "#2e3035";
    ctx.fillRect(0, 0, width, height);

    let avatar;
    try {
      avatar = await loadImage(avatarUrl.trim() || DEFAULT_AVATAR);
    } catch {
      avatar = await loadImage(DEFAULT_AVATAR);
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(pad + avatarSize / 2, pad + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, pad, pad, avatarSize, avatarSize);
    ctx.restore();

    let x = left;
    const nameY = pad + 16;

    ctx.font = "600 16px gg sans, Whitney, 'Helvetica Neue', Helvetica, Arial, sans-serif";
    ctx.fillStyle = nameColor || "#f2f3f5";
    ctx.fillText(username || "User", x, nameY);
    x += ctx.measureText(username || "User").width + 8;

    if (bot) {
      const badgeW = 36;
      const badgeH = 16;
      const badgeY = nameY - 12;
      ctx.fillStyle = "#5865f2";
      drawRoundedRect(ctx, x, badgeY, badgeW, badgeH, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "700 10px gg sans, Whitney, Helvetica, Arial, sans-serif";
      ctx.fillText("APP", x + 7, nameY - 1);
      x += badgeW + 8;
    }

    ctx.font = "400 12px gg sans, Whitney, Helvetica, Arial, sans-serif";
    ctx.fillStyle = "#949ba4";
    ctx.fillText(timestamp || "", x, nameY);

    ctx.font = "400 16px gg sans, Whitney, 'Helvetica Neue', Helvetica, Arial, sans-serif";
    ctx.fillStyle = "#dbdee1";
    lines.forEach((line, i) => {
      ctx.fillText(line, left, pad + 42 + i * 22);
    });
  };

  useEffect(() => {
    render().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, content, timestamp, nameColor, avatarUrl, bot]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "discord-fake-message.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection title="Message" description="Build a realistic Discord-style message screenshot">
          <FieldLabel>Username</FieldLabel>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="mb-3" maxLength={32} />

          <FieldLabel>Message</FieldLabel>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Message"
            className="nx-input !h-auto py-3 text-sm w-full resize-y mb-3"
            maxLength={500}
          />

          <FieldLabel>Timestamp label</FieldLabel>
          <Input value={timestamp} onChange={(e) => setTimestamp(e.target.value)} placeholder="Time" className="mb-3" />

          <FieldLabel hint="Direct image URL (CDN avatar works best)">Avatar URL</FieldLabel>
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
            className="mb-3 font-mono text-xs"
          />

          <FieldLabel>Name color</FieldLabel>
          <div className="mb-3">
            <ColorPicker value={nameColor} onChange={setNameColor} />
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--nx-text)] cursor-pointer">
            <input
              type="checkbox"
              checked={bot}
              onChange={(e) => setBot(e.target.checked)}
              className="rounded border-[var(--nx-border)]"
            />
            Show APP badge
          </label>
        </ToolSection>

        <ToolSection
          title="Preview"
          description="PNG export for memes and mockups"
          action={
            <Button type="button" size="sm" onClick={download}>
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
          }
        >
          <div className="rounded-xl overflow-hidden border border-[var(--nx-border)] bg-[#313338]">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>
          <p className="mt-3 text-xs text-[var(--nx-text-faint)]">
            For jokes and design mockups — not for impersonation or scams.
          </p>
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
