import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw, Send, Pencil, Download, Trash } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ColorPicker from "../ui/ColorPicker";
import { Checkbox } from "../ui/checkbox";
import Dropdown from "../ui/Dropdown";
import DatePicker from "../ui/DatePicker";
import ToolPanel, { ToolSection, FieldLabel, CopyCodeBlock } from "../ToolPanel";
import { hexToDecimal, decimalToHex } from "../../lib/colors";
import { isValidWebhookUrl } from "../../lib/webhook";
import { analyzeMessage } from "../../lib/limits";
import { formatDisplay, parseLocalDatetime, toLocalDatetimeString } from "../../lib/datetime";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const MAX_EMBEDS = 10;

let uid = 0;
const nextId = () => `_${++uid}_${Date.now()}`;

const emptyEmbed = () => ({
  id: nextId(),
  title: "",
  description: "",
  color: "#5865f2",
  authorName: "",
  authorUrl: "",
  authorIconUrl: "",
  footerText: "",
  footerIconUrl: "",
  url: "",
  imageUrl: "",
  thumbnailUrl: "",
  timestamp: "",
  fields: [],
});

function createExampleEmbed() {
  return {
    id: nextId(),
    title: "Welcome to Nexus",
    description:
      "Build Discord embed JSON with a live preview.\n\nSupports multiple embeds, author, footer, and more.",
    color: "#5865f2",
    authorName: "Nexus Embed Builder",
    authorUrl: "",
    authorIconUrl: "",
    footerText: "Example embed — click Reset to restore",
    footerIconUrl: "",
    url: "",
    imageUrl: "",
    thumbnailUrl: "",
    timestamp: "",
    fields: [
      { id: nextId(), name: "Status", value: "Ready", inline: true },
      { id: nextId(), name: "Tools", value: "10+", inline: true },
      { id: nextId(), name: "Tip", value: "Use Send to Discord via webhook or bot", inline: false },
    ],
  };
}

function getExampleState() {
  const embed = createExampleEmbed();
  return {
    content: "Here's an **example message** — edit anything you like, or reset to start fresh.",
    embeds: [embed],
    activeEmbedId: embed.id,
  };
}

function timestampToIso(localValue) {
  const date = parseLocalDatetime(localValue);
  if (!date) return null;
  return date.toISOString();
}

function isoToLocalDatetime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return toLocalDatetimeString(date);
}

function buildEmbedJson(embed) {
  const {
    title,
    description,
    color,
    url,
    authorName,
    authorUrl,
    authorIconUrl,
    footerText,
    footerIconUrl,
    imageUrl,
    thumbnailUrl,
    timestamp,
    fields,
  } = embed;

  const author =
    authorName.trim() &&
    {
      name: authorName,
      ...(authorUrl.trim() && { url: authorUrl }),
      ...(authorIconUrl.trim() && { icon_url: authorIconUrl }),
    };

  const footer =
    footerText.trim() &&
    {
      text: footerText,
      ...(footerIconUrl.trim() && { icon_url: footerIconUrl }),
    };

  const iso = timestampToIso(timestamp);

  return {
    ...(title && { title }),
    ...(description && { description }),
    ...(color && { color: hexToDecimal(color) || 5793266 }),
    ...(url && { url }),
    ...(author && { author }),
    ...(footer && { footer }),
    ...(imageUrl && { image: { url: imageUrl } }),
    ...(thumbnailUrl && { thumbnail: { url: thumbnailUrl } }),
    ...(iso && { timestamp: iso }),
    ...(fields.length > 0 && {
      fields: fields.map(({ name, value, inline }) => ({
        name,
        value,
        ...(inline && { inline: true }),
      })),
    }),
  };
}

function parseEmbedFromApi(embed) {
  return {
    id: nextId(),
    title: embed.title || "",
    description: embed.description || "",
    color: embed.color != null ? decimalToHex(embed.color) || "#5865f2" : "#5865f2",
    authorName: embed.author?.name || "",
    authorUrl: embed.author?.url || "",
    authorIconUrl: embed.author?.icon_url || "",
    footerText: embed.footer?.text || "",
    footerIconUrl: embed.footer?.icon_url || "",
    url: embed.url || "",
    imageUrl: embed.image?.url || "",
    thumbnailUrl: embed.thumbnail?.url || "",
    timestamp: isoToLocalDatetime(embed.timestamp),
    fields: (embed.fields || []).map((f) => ({
      id: nextId(),
      name: f.name || "",
      value: f.value || "",
      inline: f.inline ?? false,
    })),
  };
}

function parseImportPayload(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Invalid JSON." };
  }

  let content = "";
  let embeds = [];
  let components = null;
  let messageId = null;

  if (Array.isArray(parsed)) {
    embeds = parsed;
  } else if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.embeds)) {
      content = typeof parsed.content === "string" ? parsed.content : "";
      embeds = parsed.embeds;
      if (Array.isArray(parsed.components)) components = parsed.components;
      if (parsed.id) messageId = String(parsed.id);
    } else if (
      parsed.title != null ||
      parsed.description != null ||
      parsed.fields != null ||
      parsed.color != null
    ) {
      embeds = [parsed];
    } else {
      return { error: "JSON must be a message, embeds array, or single embed." };
    }
  } else {
    return { error: "JSON must be an object or array." };
  }

  const parsedEmbeds = embeds.length ? embeds.map(parseEmbedFromApi) : [emptyEmbed()];
  return {
    content,
    embeds: parsedEmbeds,
    components,
    messageId,
  };
}

function parseComponentsJson(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return { components: null };
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      return { error: "Components must be a JSON array of action rows." };
    }
    return { components: parsed };
  } catch {
    return { error: "Invalid components JSON." };
  }
}

function applyMessageToEditor(
  message,
  { setContent, setEmbeds, setActiveEmbedId, setMessageId, setComponentsJson }
) {
  setContent(message.content || "");
  const parsedEmbeds = message.embeds?.length ? message.embeds.map(parseEmbedFromApi) : [emptyEmbed()];
  setEmbeds(parsedEmbeds);
  setActiveEmbedId(parsedEmbeds[0].id);
  if (message.id) setMessageId(String(message.id));
  if (setComponentsJson) {
    setComponentsJson(
      Array.isArray(message.components) && message.components.length
        ? JSON.stringify(message.components, null, 2)
        : ""
    );
  }
}

function EmbedPreview({ embed }) {
  const {
    title,
    description,
    color,
    authorName,
    authorUrl,
    authorIconUrl,
    footerText,
    footerIconUrl,
    imageUrl,
    thumbnailUrl,
    timestamp,
    fields,
  } = embed;

  const hasAuthor = authorName.trim();
  const hasFooter = footerText.trim();
  const timestampLabel = timestamp ? formatDisplay(timestamp) : "";

  return (
    <div
      className="discord-embed-preview rounded-md bg-[#2b2d31] p-3 max-w-[520px]"
      style={{ borderLeftColor: color || "#5865f2" }}
    >
      {thumbnailUrl && thumbnailUrl.startsWith("http") && (
        <img
          src={thumbnailUrl}
          alt=""
          className="float-right ml-3 mb-1 w-16 h-16 rounded object-cover"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      )}
      {hasAuthor && (
        <div className="flex items-center gap-2 mb-1">
          {authorIconUrl && authorIconUrl.startsWith("http") && (
            <img
              src={authorIconUrl}
              alt=""
              className="w-6 h-6 rounded-full object-cover shrink-0"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          {authorUrl ? (
            <a
              href={authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#00a8fc] hover:underline font-medium"
            >
              {authorName}
            </a>
          ) : (
            <p className="text-xs text-[#dbdee1] font-medium">{authorName}</p>
          )}
        </div>
      )}
      {title && <p className="text-sm font-semibold text-[#00a8fc] mb-1">{title}</p>}
      {description && <p className="text-sm text-[#dbdee1] whitespace-pre-wrap">{description}</p>}
      {fields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 clear-both">
          {fields.map((f) => (
            <div key={f.id || f.name + f.value} className={f.inline === false ? "sm:col-span-2" : undefined}>
              <p className="text-xs font-semibold text-[#f2f3f5]">{f.name}</p>
              <p className="text-xs text-[#dbdee1]">{f.value}</p>
            </div>
          ))}
        </div>
      )}
      {imageUrl && (
        <div className="mt-2 rounded-md bg-[#313338] h-40 flex items-center justify-center text-xs text-[#949ba4] overflow-hidden clear-both">
          {imageUrl.startsWith("http") ? (
            <img
              src={imageUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            "Image preview"
          )}
        </div>
      )}
      {(hasFooter || timestampLabel) && (
        <div className="flex items-center gap-2 mt-2 clear-both flex-wrap">
          {footerIconUrl && footerIconUrl.startsWith("http") && (
            <img
              src={footerIconUrl}
              alt=""
              className="w-5 h-5 rounded-full object-cover shrink-0"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <p className="text-[11px] text-[#949ba4]">
            {hasFooter && footerText}
            {hasFooter && timestampLabel ? " • " : ""}
            {timestampLabel}
          </p>
        </div>
      )}
    </div>
  );
}

function EmbedEditor({ embed, onChange }) {
  const [fieldName, setFieldName] = useState("");
  const [fieldValue, setFieldValue] = useState("");

  const update = (patch) => onChange({ ...embed, ...patch });

  const addField = () => {
    if (!fieldName.trim() || !fieldValue.trim()) return;
    update({
      fields: [
        ...embed.fields,
        { id: nextId(), name: fieldName.trim(), value: fieldValue.trim(), inline: false },
      ],
    });
    setFieldName("");
    setFieldValue("");
  };

  const updateField = (index, patch) => {
    onChange({
      ...embed,
      fields: embed.fields.map((f, i) =>
        i === index ? { ...f, ...patch, id: f.id ?? nextId() } : f
      ),
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Title</FieldLabel>
        <Input
          value={embed.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Embed title"
        />
      </div>
      <div>
        <FieldLabel>Description</FieldLabel>
        <textarea
          value={embed.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Supports markdown"
          rows={5}
          className="nx-textarea"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Color</FieldLabel>
          <div className="flex gap-2">
            <ColorPicker
              value={embed.color}
              onChange={(color) => update({ color })}
              aria-label="Embed color"
            />
            <Input
              value={embed.color}
              onChange={(e) => update({ color: e.target.value })}
              className="font-mono flex-1"
            />
          </div>
        </div>
        <div>
          <FieldLabel>Title URL</FieldLabel>
          <Input
            value={embed.url}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="https://…"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Image URL</FieldLabel>
          <Input
            value={embed.imageUrl}
            onChange={(e) => update({ imageUrl: e.target.value })}
            placeholder="https://…"
          />
        </div>
        <div>
          <FieldLabel>Thumbnail URL</FieldLabel>
          <Input
            value={embed.thumbnailUrl}
            onChange={(e) => update({ thumbnailUrl: e.target.value })}
            placeholder="https://…"
          />
        </div>
      </div>

      <div>
        <FieldLabel hint="Shown next to the footer">Timestamp</FieldLabel>
        <div className="flex gap-2 items-center">
          <DatePicker
            value={embed.timestamp || ""}
            onChange={(value) => update({ timestamp: value })}
            className="flex-1"
          />
          {embed.timestamp && (
            <Button type="button" variant="secondary" size="sm" onClick={() => update({ timestamp: "" })}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--nx-border)] p-3 space-y-3">
        <FieldLabel>Author</FieldLabel>
        <div>
          <FieldLabel hint="Required for author to appear">Name</FieldLabel>
          <Input
            value={embed.authorName}
            onChange={(e) => update({ authorName: e.target.value })}
            placeholder="Author name"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel hint="Optional">URL</FieldLabel>
            <Input
              value={embed.authorUrl}
              onChange={(e) => update({ authorUrl: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div>
            <FieldLabel hint="Optional">Icon URL</FieldLabel>
            <Input
              value={embed.authorIconUrl}
              onChange={(e) => update({ authorIconUrl: e.target.value })}
              placeholder="https://…"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--nx-border)] p-3 space-y-3">
        <FieldLabel>Footer</FieldLabel>
        <div>
          <FieldLabel hint="Required for footer to appear">Text</FieldLabel>
          <Input
            value={embed.footerText}
            onChange={(e) => update({ footerText: e.target.value })}
            placeholder="Footer text"
          />
        </div>
        <div>
          <FieldLabel hint="Optional">Icon URL</FieldLabel>
          <Input
            value={embed.footerIconUrl}
            onChange={(e) => update({ footerIconUrl: e.target.value })}
            placeholder="https://…"
          />
        </div>
      </div>

      <div>
        <FieldLabel>Fields</FieldLabel>
        <div className="flex gap-2 mb-2">
          <Input
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="Field name"
            className="flex-1"
          />
          <Input
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            placeholder="Field value"
            className="flex-1"
          />
          <Button type="button" onClick={addField} size="default" className="shrink-0">
            Add
          </Button>
        </div>
        {embed.fields.map((f, i) => (
          <div
            key={f.id}
            className="rounded-md border border-[var(--nx-border)] bg-[#1e1f22] p-3 mb-2 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#949ba4]">Field {i + 1}</span>
              <button
                type="button"
                onClick={() => update({ fields: embed.fields.filter((_, j) => j !== i) })}
                className="text-[#f23f43] text-xs hover:underline shrink-0"
              >
                Remove
              </button>
            </div>
            <Input
              value={f.name}
              onChange={(e) => updateField(i, { name: e.target.value })}
              placeholder="Field name"
            />
            <textarea
              value={f.value}
              onChange={(e) => updateField(i, { value: e.target.value })}
              placeholder="Field value"
              rows={2}
              className="nx-textarea text-sm"
            />
            <Checkbox
              checked={!!f.inline}
              onCheckedChange={(v) => updateField(i, { inline: v })}
              label="Inline"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmbedBuilderTool() {
  const { user, loading: authLoading, login, guilds, guildsLoading, loadGuilds } = useAuth();
  const [initialState] = useState(() => getExampleState());
  const [content, setContent] = useState(initialState.content);
  const [embeds, setEmbeds] = useState(initialState.embeds);
  const [activeEmbedId, setActiveEmbedId] = useState(initialState.activeEmbedId);
  const [componentsJson, setComponentsJson] = useState("");
  const [importJson, setImportJson] = useState("");
  const [importResult, setImportResult] = useState(null);

  const [sendMode, setSendMode] = useState("webhook");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [messageId, setMessageId] = useState("");
  const [webhookUsername, setWebhookUsername] = useState("");
  const [webhookAvatar, setWebhookAvatar] = useState("");
  const [guildId, setGuildId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [sendResult, setSendResult] = useState(null);

  const resetToExample = () => {
    const example = getExampleState();
    setContent(example.content);
    setEmbeds(example.embeds);
    setActiveEmbedId(example.activeEmbedId);
    setComponentsJson("");
    setImportJson("");
    setImportResult(null);
  };

  const activeEmbed = embeds.find((e) => e.id === activeEmbedId) || embeds[0];

  const updateEmbed = (id, next) => {
    setEmbeds((prev) => prev.map((e) => (e.id === id ? next : e)));
  };

  const addEmbed = () => {
    if (embeds.length >= MAX_EMBEDS) return;
    const embed = emptyEmbed();
    setEmbeds((prev) => [...prev, embed]);
    setActiveEmbedId(embed.id);
  };

  const removeEmbed = (id) => {
    if (embeds.length <= 1) return;
    const next = embeds.filter((e) => e.id !== id);
    setEmbeds(next);
    if (activeEmbedId === id) setActiveEmbedId(next[0].id);
  };

  const embedsJson = embeds.map(buildEmbedJson).filter((e) => Object.keys(e).length > 0);
  const componentsParsed = parseComponentsJson(componentsJson);

  const payloadObj = {
    ...(content.trim() && { content }),
    ...(embedsJson.length > 0 && { embeds: embedsJson }),
    ...(componentsParsed.components && { components: componentsParsed.components }),
  };
  const payload = JSON.stringify(payloadObj, null, 2);
  const hasPayload = Object.keys(payloadObj).length > 0;
  const webhookValid = isValidWebhookUrl(webhookUrl);
  const componentsOk = !componentsJson.trim() || !componentsParsed.error;

  const limitChecks = useMemo(() => {
    return analyzeMessage(payloadObj).overs;
  }, [payload]);

  const botGuilds = useMemo(
    () => (guilds || []).filter((g) => g.botInGuild),
    [guilds]
  );
  const guildsWithoutBot = useMemo(
    () => (guilds || []).filter((g) => !g.botInGuild),
    [guilds]
  );
  const selectedGuild = (guilds || []).find((g) => String(g.id) === String(guildId));

  const guildOptions = useMemo(() => {
    const withBot = botGuilds.map((g) => ({ value: g.id, label: g.name }));
    const without = guildsWithoutBot.map((g) => ({
      value: g.id,
      label: `${g.name} (bot not in server)`,
    }));
    return [...withBot, ...without];
  }, [botGuilds, guildsWithoutBot]);

  const channelOptions = useMemo(
    () =>
      channels.map((ch) => ({
        value: ch.id,
        label: ch.parentName ? `#${ch.name} · ${ch.parentName}` : `#${ch.name}`,
      })),
    [channels]
  );

  useEffect(() => {
    if (sendMode !== "bot" || !user) return;
    loadGuilds().catch(() => {});
  }, [sendMode, user, loadGuilds]);

  useEffect(() => {
    if (sendMode !== "bot" || !guildId || !selectedGuild?.botInGuild) {
      setChannels([]);
      setChannelsError(null);
      return;
    }

    let cancelled = false;
    setChannelsLoading(true);
    setChannelsError(null);
    setChannelId("");

    fetch(`/api/guild-channels?guildId=${encodeURIComponent(guildId)}`, {
      credentials: "include",
    })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setChannels([]);
          setChannelsError(data.error || "Failed to load channels.");
          return;
        }
        setChannels(data.channels || []);
      })
      .catch(() => {
        if (!cancelled) {
          setChannels([]);
          setChannelsError("Failed to load channels.");
        }
      })
      .finally(() => {
        if (!cancelled) setChannelsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sendMode, guildId, selectedGuild?.botInGuild]);

  const buildWebhookPayload = () => ({
    ...payloadObj,
    ...(webhookUsername.trim() && { username: webhookUsername.trim() }),
    ...(webhookAvatar.trim() && { avatar_url: webhookAvatar.trim() }),
  });

  const botReady = Boolean(user && guildId && channelId && selectedGuild?.botInGuild);
  const canAct =
    hasPayload &&
    componentsOk &&
    (sendMode === "webhook" ? webhookValid : botReady);

  const applyImport = () => {
    setImportResult(null);
    const result = parseImportPayload(importJson);
    if (result.error) {
      setImportResult({ ok: false, msg: result.error });
      return;
    }
    setContent(result.content || "");
    setEmbeds(result.embeds);
    setActiveEmbedId(result.embeds[0].id);
    if (result.components) {
      setComponentsJson(JSON.stringify(result.components, null, 2));
    }
    if (result.messageId) setMessageId(result.messageId);
    setImportResult({ ok: true, msg: "Imported into the editor." });
  };

  const sendToDiscord = async () => {
    if (!canAct) return;
    setBusy("send");
    setSendResult(null);
    try {
      if (sendMode === "webhook") {
        const res = await fetch("/api/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhookUrl: webhookUrl.trim(), payload: buildWebhookPayload() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSendResult({ ok: false, msg: data.error || "Failed to send message." });
          return;
        }
        setMessageId(String(data.id));
        setSendResult({ ok: true, msg: "Message sent! You can edit and update it." });
        return;
      }

      const res = await fetch("/api/bot-messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, channelId, payload: payloadObj }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendResult({
          ok: false,
          msg: data.error || "Failed to send message.",
          inviteUrl: data.inviteUrl,
        });
        return;
      }
      setMessageId(String(data.id));
      setSendResult({ ok: true, msg: "Message sent as the bot! You can edit and update it." });
    } catch {
      setSendResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const updateOnDiscord = async () => {
    if (!canAct || !messageId.trim()) return;
    setBusy("update");
    setSendResult(null);
    try {
      if (sendMode === "webhook") {
        const res = await fetch("/api/webhook", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            webhookUrl: webhookUrl.trim(),
            messageId: messageId.trim(),
            payload: payloadObj,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSendResult({ ok: false, msg: data.error || "Failed to update message." });
          return;
        }
        setSendResult({ ok: true, msg: "Message updated on Discord." });
        return;
      }

      const res = await fetch("/api/bot-messages", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          channelId,
          messageId: messageId.trim(),
          payload: payloadObj,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendResult({ ok: false, msg: data.error || "Failed to update message." });
        return;
      }
      setSendResult({ ok: true, msg: "Message updated on Discord." });
    } catch {
      setSendResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const loadFromDiscord = async () => {
    if (!messageId.trim()) return;
    if (sendMode === "webhook" && !webhookValid) return;
    if (sendMode === "bot" && !botReady) return;

    setBusy("load");
    setSendResult(null);
    try {
      let res;
      if (sendMode === "webhook") {
        const params = new URLSearchParams({
          webhookUrl: webhookUrl.trim(),
          messageId: messageId.trim(),
        });
        res = await fetch(`/api/webhook?${params}`);
      } else {
        const params = new URLSearchParams({
          guildId,
          channelId,
          messageId: messageId.trim(),
        });
        res = await fetch(`/api/bot-messages?${params}`, { credentials: "include" });
      }
      const data = await res.json();
      if (!res.ok) {
        setSendResult({ ok: false, msg: data.error || "Failed to load message." });
        return;
      }
      applyMessageToEditor(data, {
        setContent,
        setEmbeds,
        setActiveEmbedId,
        setMessageId,
        setComponentsJson,
      });
      setSendResult({ ok: true, msg: "Message loaded into the editor." });
    } catch {
      setSendResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const deleteFromDiscord = async () => {
    if (!messageId.trim()) return;
    if (sendMode === "webhook" && !webhookValid) return;
    if (sendMode === "bot" && !botReady) return;

    setBusy("delete");
    setSendResult(null);
    try {
      let res;
      if (sendMode === "webhook") {
        res = await fetch("/api/webhook", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhookUrl: webhookUrl.trim(), messageId: messageId.trim() }),
        });
      } else {
        res = await fetch("/api/bot-messages", {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guildId,
            channelId,
            messageId: messageId.trim(),
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setSendResult({ ok: false, msg: data.error || "Failed to delete message." });
        return;
      }
      setMessageId("");
      setSendResult({ ok: true, msg: "Message deleted from Discord." });
    } catch {
      setSendResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:h-full lg:min-h-0">
        <div className="space-y-3 sm:space-y-4 lg:overflow-y-auto lg:scrollbar-visible lg:min-h-0">
          <div className="flex justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={resetToExample}>
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to example
            </Button>
          </div>

          <ToolSection title="Message Content">
            <div>
              <FieldLabel hint="Plain text shown above embeds (supports Discord markdown)">
                Content
              </FieldLabel>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Message text"
                rows={4}
                maxLength={2000}
                className="nx-textarea"
              />
              <p className="mt-1.5 text-xs text-[var(--nx-text-faint)]">{content.length}/2000</p>
            </div>
          </ToolSection>

          <ToolSection
            title="Embeds"
            description={`${embeds.length}/${MAX_EMBEDS} embeds`}
            action={
              embeds.length < MAX_EMBEDS ? (
                <Button type="button" variant="secondary" size="sm" onClick={addEmbed}>
                  <Plus className="w-3.5 h-3.5" />
                  Add embed
                </Button>
              ) : null
            }
          >
            <div className="flex flex-wrap gap-1.5 mb-4">
              {embeds.map((embed, i) => (
                <button
                  key={embed.id}
                  type="button"
                  onClick={() => setActiveEmbedId(embed.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors",
                    embed.id === activeEmbed?.id
                      ? "bg-[#5865f2] text-white"
                      : "bg-[#1e1f22] text-[#dbdee1] hover:bg-[#2b2d31]"
                  )}
                >
                  Embed {i + 1}
                  {embeds.length > 1 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEmbed(embed.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          removeEmbed(embed.id);
                        }
                      }}
                      className="opacity-70 hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            {activeEmbed && (
              <EmbedEditor
                key={activeEmbed.id}
                embed={activeEmbed}
                onChange={(next) => updateEmbed(activeEmbed.id, next)}
              />
            )}
          </ToolSection>

          <ToolSection
            title="Components"
            description="Paste action rows from the Components tool (optional)"
          >
            <textarea
              value={componentsJson}
              onChange={(e) => setComponentsJson(e.target.value)}
              placeholder="Paste component JSON"
              rows={5}
              className="nx-textarea font-mono text-xs"
            />
            {componentsParsed.error && (
              <p className="mt-1.5 text-xs text-[#f0b232]">{componentsParsed.error}</p>
            )}
          </ToolSection>

          <ToolSection title="Import JSON" description="Paste a Discord message, embeds array, or single embed">
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste message JSON"
              rows={4}
              className="nx-textarea font-mono text-xs"
            />
            <div className="mt-2 flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={applyImport} disabled={!importJson.trim()}>
                Import
              </Button>
              {importResult && (
                <p className={cn("text-sm", importResult.ok ? "text-[#23a559]" : "text-[#f23f43]")}>
                  {importResult.msg}
                </p>
              )}
            </div>
          </ToolSection>

          <ToolSection
            title="Send to Discord"
            description={
              messageId
                ? `Editing message ${messageId}`
                : sendMode === "webhook"
                  ? "Send via webhook, then update after editing"
                  : "Send as the bot into a server channel"
            }
          >
            <div className="space-y-3">
              <div className="inline-flex rounded-lg border border-[var(--nx-border)] p-0.5 bg-[#1e1f22]">
                {[
                  { id: "webhook", label: "Webhook" },
                  { id: "bot", label: "Bot" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setSendMode(mode.id);
                      setSendResult(null);
                    }}
                    className={cn(
                      "h-8 px-3 rounded-md text-xs font-semibold transition-colors",
                      sendMode === mode.id
                        ? "bg-[#5865f2] text-white"
                        : "text-[#dbdee1] hover:bg-[#2b2d31]"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {sendMode === "webhook" ? (
                <>
                  <div>
                    <FieldLabel hint="Server Settings → Integrations → Webhooks">Webhook URL</FieldLabel>
                    <Input
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://…"
                      className="font-mono text-xs"
                    />
                    {webhookUrl && !webhookValid && (
                      <p className="mt-1.5 text-xs text-[#f0b232]">URL format looks invalid.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel hint="Optional override">Username</FieldLabel>
                      <Input
                        value={webhookUsername}
                        onChange={(e) => setWebhookUsername(e.target.value)}
                        placeholder="Custom username"
                      />
                    </div>
                    <div>
                      <FieldLabel hint="Optional override">Avatar URL</FieldLabel>
                      <Input
                        value={webhookAvatar}
                        onChange={(e) => setWebhookAvatar(e.target.value)}
                        placeholder="https://…"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {authLoading ? (
                    <p className="text-sm text-[var(--nx-text-muted)]">Checking session…</p>
                  ) : !user ? (
                    <div className="rounded-lg border border-[var(--nx-border)] bg-[#1e1f22] p-3 space-y-2">
                      <p className="text-sm text-[var(--nx-text-muted)]">
                        Log in with Discord to send as the bot into servers you manage.
                      </p>
                      <Button type="button" size="sm" onClick={login}>
                        Log in with Discord
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <FieldLabel>Server</FieldLabel>
                        <Dropdown
                          value={guildId}
                          onChange={(value) => {
                            setGuildId(value);
                            setChannelId("");
                            setSendResult(null);
                          }}
                          options={
                            guildOptions.length
                              ? guildOptions
                              : [{ value: "", label: guildsLoading ? "Loading…" : "No manageable servers", disabled: true }]
                          }
                          placeholder={guildsLoading ? "Loading servers…" : "Select a server"}
                          disabled={guildsLoading}
                          aria-label="Server"
                        />
                        {selectedGuild && !selectedGuild.botInGuild && (
                          <p className="mt-1.5 text-xs text-[var(--nx-text-muted)]">
                            Bot is not in this server.
                            {selectedGuild.inviteUrl ? (
                              <>
                                {" "}
                                <a
                                  href={selectedGuild.inviteUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[var(--nx-accent)] hover:underline"
                                >
                                  Invite bot
                                </a>
                              </>
                            ) : null}
                          </p>
                        )}
                      </div>
                      <div>
                        <FieldLabel>Channel</FieldLabel>
                        <Dropdown
                          value={channelId}
                          onChange={setChannelId}
                          options={
                            channelOptions.length
                              ? channelOptions
                              : [
                                  {
                                    value: "",
                                    label: channelsLoading
                                      ? "Loading…"
                                      : channelsError || "Select a server first",
                                    disabled: true,
                                  },
                                ]
                          }
                          placeholder={
                            channelsLoading
                              ? "Loading channels…"
                              : channelOptions.length
                                ? "Select a channel"
                                : "No text channels"
                          }
                          disabled={!guildId || !selectedGuild?.botInGuild || channelsLoading}
                          aria-label="Channel"
                        />
                        {channelsError && (
                          <p className="mt-1.5 text-xs text-[#f0b232]">{channelsError}</p>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              <div>
                <FieldLabel hint="Auto-filled after send, or paste to load/edit an existing message">
                  Message ID
                </FieldLabel>
                <Input
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  placeholder="Message ID"
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={sendToDiscord} disabled={!canAct || busy}>
                  <Send className="w-3.5 h-3.5" />
                  {busy === "send" ? "Sending..." : "Send"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={updateOnDiscord}
                  disabled={!canAct || !messageId.trim() || busy}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {busy === "update" ? "Updating..." : "Update"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={loadFromDiscord}
                  disabled={
                    !messageId.trim() ||
                    busy ||
                    (sendMode === "webhook" ? !webhookValid : !botReady)
                  }
                >
                  <Download className="w-3.5 h-3.5" />
                  {busy === "load" ? "Loading..." : "Load"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={deleteFromDiscord}
                  disabled={
                    !messageId.trim() ||
                    busy ||
                    (sendMode === "webhook" ? !webhookValid : !botReady)
                  }
                >
                  <Trash className="w-3.5 h-3.5" />
                  {busy === "delete" ? "Deleting..." : "Delete"}
                </Button>
              </div>

              {!hasPayload && (
                <p className="text-xs text-[var(--nx-text-faint)]">
                  Add message content or embeds before sending.
                </p>
              )}
              {sendResult && (
                <div className="space-y-1">
                  <p className={cn("text-sm", sendResult.ok ? "text-[#23a559]" : "text-[#f23f43]")}>
                    {sendResult.msg}
                  </p>
                  {sendResult.inviteUrl && (
                    <a
                      href={sendResult.inviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--nx-accent)] hover:underline"
                    >
                      Invite bot to this server
                    </a>
                  )}
                </div>
              )}
            </div>
          </ToolSection>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 lg:min-h-0">
          <ToolSection title="Live Preview" className="shrink-0">
            <div className="rounded-md bg-[#1e1f22] p-6 min-h-[280px] overflow-y-auto scrollbar-visible">
              <div className="flex gap-3 max-w-lg">
                <div className="w-10 h-10 rounded-full bg-[#5865f2] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[#f2f3f5]">Bot</span>
                    <span className="text-[10px] bg-[#5865f2] text-white px-1 rounded font-medium">
                      BOT
                    </span>
                    <span className="text-[11px] text-[#949ba4]">Today at 12:00 PM</span>
                  </div>
                  <div className="space-y-2 mt-1">
                    {content.trim() && (
                      <p className="text-sm text-[#dbdee1] whitespace-pre-wrap">{content}</p>
                    )}
                    {embeds.map((embed) => (
                      <EmbedPreview key={embed.id} embed={embed} />
                    ))}
                    {!content.trim() && embeds.every((e) => Object.keys(buildEmbedJson(e)).length === 0) && (
                      <p className="text-sm text-[#949ba4]">Add message content or embeds to see a preview.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ToolSection>

          {limitChecks.length > 0 && (
            <ToolSection title="Limit warnings" description="Discord will reject this payload">
              <ul className="space-y-1.5">
                {limitChecks.map((check) => (
                  <li key={check.path} className="text-xs text-[#f23f43]">
                    <span className="font-mono">{check.path}</span>
                    {`: ${check.current}/${check.max}`}
                    {check.note ? ` — ${check.note}` : ""}
                  </li>
                ))}
              </ul>
            </ToolSection>
          )}

          <CopyCodeBlock
            value={hasPayload ? payload : "{}"}
            label="JSON Payload"
            description={hasPayload ? undefined : "Empty — add content to generate a payload"}
            emptyHint="Paste-ready Discord message JSON appears here as you build."
            className="lg:sticky lg:top-0"
          />
        </div>
      </div>
    </ToolPanel>
  );
}
