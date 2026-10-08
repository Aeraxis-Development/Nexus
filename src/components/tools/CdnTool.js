import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import ToolPanel, { ToolSection, FieldLabel, CopyField } from "../ToolPanel";
import {
  buildCdnUrl,
  CDN_FORMATS,
  CDN_KINDS,
  CDN_SIZES,
  sanitizeSnowflake,
} from "../../lib/cdn";
import { cn } from "@/lib/utils";

const EMPTY = {
  userId: "",
  guildId: "",
  emojiId: "",
  appId: "",
  roleId: "",
  hash: "",
  size: 256,
  format: "",
  animated: false,
};

export default function CdnTool() {
  const [kindId, setKindId] = useState("avatar");
  const [params, setParams] = useState(EMPTY);
  const [fetched, setFetched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [resolvedName, setResolvedName] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const kind = CDN_KINDS.find((k) => k.id === kindId);
  const url = useMemo(() => {
    if (!fetched) return "";
    return buildCdnUrl(kindId, params);
  }, [kindId, params, fetched]);

  useEffect(() => {
    setPreviewError(false);
  }, [url]);

  const set = (key, value) => setParams((prev) => ({ ...prev, [key]: value }));

  const switchKind = (id) => {
    setKindId(id);
    setParams({ ...EMPTY, size: 256 });
    setFetched(false);
    setError("");
    setNote("");
    setResolvedName("");
    setShowAdvanced(false);
  };

  const onIdChange = (key) => (e) => {
    const raw = e.target.value;
    setFetched(false);
    setResolvedName("");
    setNote("");
    if (/[<:]/.test(raw)) {
      const id = sanitizeSnowflake(raw);
      set(key, id);
      if (key === "emojiId" && raw.startsWith("<a:")) set("animated", true);
      return;
    }
    set(key, raw.replace(/\D/g, ""));
  };

  const resolve = async () => {
    setLoading(true);
    setError("");
    setNote("");
    setFetched(false);

    try {
      const res = await fetch("/api/cdn-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kindId,
          userId: params.userId,
          guildId: params.guildId,
          appId: params.appId,
          emojiId: params.emojiId,
          roleId: params.roleId,
          size: params.size,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not resolve asset via Discord API.");
        return;
      }

      if (data.kindId && data.kindId !== kindId) {
        setKindId(data.kindId);
      }
      setParams((prev) => ({
        ...prev,
        ...data.params,
        size: data.params?.size || prev.size,
      }));
      setResolvedName(data.name || "");
      setNote(data.note || "");
      setFetched(true);
    } catch {
      setError("Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const canResolve = () => {
    if (kindId === "emoji") {
      return /^\d{17,20}$/.test(params.guildId) && /^\d{17,20}$/.test(params.emojiId);
    }
    if (kindId === "appIcon") return /^\d{17,20}$/.test(params.appId);
    if (kindId === "roleIcon") {
      return /^\d{17,20}$/.test(params.guildId) && /^\d{17,20}$/.test(params.roleId);
    }
    if (kindId === "memberAvatar") {
      return /^\d{17,20}$/.test(params.guildId) && /^\d{17,20}$/.test(params.userId);
    }
    if (
      kindId === "guildIcon" ||
      kindId === "guildBanner" ||
      kindId === "splash" ||
      kindId === "discoverySplash"
    ) {
      return /^\d{17,20}$/.test(params.guildId);
    }
    return /^\d{17,20}$/.test(params.userId);
  };

  const idLabel = {
    userId: "User ID",
    guildId: "Guild ID",
    emojiId: "Emoji ID",
    appId: "Application ID",
    roleId: "Role ID",
  };

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
        <ToolSection title="Asset type" className="xl:col-span-1">
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto scrollbar-visible">
            {CDN_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => switchKind(k.id)}
                className={cn("nx-selectable", kindId === k.id && "nx-selectable-active")}
              >
                <span className="text-sm font-semibold text-[var(--nx-text-heading)]">{k.label}</span>
              </button>
            ))}
          </div>
        </ToolSection>

        <ToolSection
          title="Lookup"
          description="IDs only — resolved entirely through the Discord API"
          className="xl:col-span-1"
        >
          {kind?.fields.includes("userId") && (
            <>
              <FieldLabel>{idLabel.userId}</FieldLabel>
              <Input
                value={params.userId}
                onChange={onIdChange("userId")}
                className="font-mono text-sm mb-3"
                placeholder="Snowflake ID"
                onKeyDown={(e) => e.key === "Enter" && canResolve() && resolve()}
              />
            </>
          )}
          {kind?.fields.includes("guildId") && (
            <>
              <FieldLabel>
                {kindId === "emoji" || kindId === "roleIcon" || kindId === "memberAvatar"
                  ? "Guild ID"
                  : idLabel.guildId}
              </FieldLabel>
              <Input
                value={params.guildId}
                onChange={onIdChange("guildId")}
                className="font-mono text-sm mb-3"
                placeholder="Snowflake ID"
                onKeyDown={(e) => e.key === "Enter" && canResolve() && resolve()}
              />
            </>
          )}
          {kind?.fields.includes("emojiId") && (
            <>
              <FieldLabel hint="Paste an ID or <:name:id>">Emoji ID</FieldLabel>
              <Input
                value={params.emojiId}
                onChange={onIdChange("emojiId")}
                className="font-mono text-sm mb-3"
                placeholder="Snowflake ID"
                onKeyDown={(e) => e.key === "Enter" && canResolve() && resolve()}
              />
            </>
          )}
          {kind?.fields.includes("appId") && (
            <>
              <FieldLabel>{idLabel.appId}</FieldLabel>
              <Input
                value={params.appId}
                onChange={onIdChange("appId")}
                className="font-mono text-sm mb-3"
                placeholder="Snowflake ID"
                onKeyDown={(e) => e.key === "Enter" && canResolve() && resolve()}
              />
            </>
          )}
          {kind?.fields.includes("roleId") && (
            <>
              <FieldLabel>{idLabel.roleId}</FieldLabel>
              <Input
                value={params.roleId}
                onChange={onIdChange("roleId")}
                className="font-mono text-sm mb-3"
                placeholder="Snowflake ID"
                onKeyDown={(e) => e.key === "Enter" && canResolve() && resolve()}
              />
            </>
          )}

          <Button
            onClick={resolve}
            disabled={loading || !canResolve()}
            className="w-full sm:w-auto mb-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Fetch via API
          </Button>

          {error && <p className="text-xs text-[var(--nx-red)] mb-3">{error}</p>}
          {resolvedName && (
            <p className="text-xs text-[var(--nx-text-muted)] mb-3">
              Resolved: <span className="font-semibold text-[var(--nx-text-heading)]">{resolvedName}</span>
            </p>
          )}
          {note && <p className="text-xs text-[var(--nx-text-faint)] mb-3">{note}</p>}

          <FieldLabel>Size</FieldLabel>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {CDN_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("size", s)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold border tabular-nums",
                  params.size === s
                    ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)] text-[var(--nx-text-heading)]"
                    : "border-[var(--nx-border)] text-[var(--nx-text-muted)]"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-semibold text-[var(--nx-accent)] hover:underline mb-3"
          >
            {showAdvanced ? "Hide" : "Show"} advanced options
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-1 border-t border-[var(--nx-border)]">
              {kind?.fields.includes("hash") && (
                <>
                  <FieldLabel hint="Filled automatically after fetch">Hash</FieldLabel>
                  <Input
                    value={params.hash}
                    onChange={(e) => {
                      setFetched(true);
                      set("hash", e.target.value.trim());
                    }}
                    className="font-mono text-sm"
                    placeholder="Hash"
                  />
                </>
              )}

              {kind?.fields.includes("format") && (
                <>
                  <FieldLabel>Format</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => set("format", "")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-semibold border",
                        !params.format
                          ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)]"
                          : "border-[var(--nx-border)] text-[var(--nx-text-muted)]"
                      )}
                    >
                      Auto
                    </button>
                    {CDN_FORMATS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => set("format", f)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-semibold border uppercase",
                          params.format === f
                            ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)]"
                            : "border-[var(--nx-border)] text-[var(--nx-text-muted)]"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {kind?.fields.includes("animated") && (
                <Checkbox
                  checked={params.animated || params.hash?.startsWith("a_")}
                  onCheckedChange={(v) => set("animated", v)}
                  label="Animated"
                />
              )}
            </div>
          )}
        </ToolSection>

        <ToolSection title="Output" className="xl:col-span-1">
          <CopyField
            label="CDN URL"
            value={url}
            placeholder="CDN URL"
          />

          <div className="mt-5 rounded-xl border border-[var(--nx-border)] bg-[var(--nx-bg-input)] p-4 flex flex-col items-center justify-center min-h-[200px] gap-3">
            {url && !previewError ? (
              <img
                key={url}
                src={url}
                alt="CDN preview"
                className="max-h-44 max-w-full object-contain rounded-lg"
                onLoad={() => setPreviewError(false)}
                onError={() => setPreviewError(true)}
              />
            ) : (
              <p className="text-sm text-[var(--nx-text-faint)] text-center px-2">
                {url
                  ? "Couldn’t load this asset. Try Fetch via API again or check the IDs."
                  : "Enter Discord IDs and fetch via the API"}
              </p>
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[var(--nx-accent)] hover:underline"
              >
                Open in new tab
              </a>
            )}
          </div>
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
