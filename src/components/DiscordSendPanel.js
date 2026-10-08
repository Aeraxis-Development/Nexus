import { useEffect, useMemo, useState } from "react";
import { Send, Pencil, Download, Trash } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Dropdown from "./ui/Dropdown";
import { ToolSection, FieldLabel } from "./ToolPanel";
import { isValidWebhookUrl } from "@/lib/webhook";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/**
 * Dual webhook / bot message delivery panel.
 * Reused by Embed Builder, Components, Polls, Webhook tools.
 */
export default function DiscordSendPanel({
  payload,
  enabled = true,
  description,
  allowWebhookOverrides = true,
  showUpdate = true,
  showLoad = true,
  showDelete = true,
  defaultMode = "webhook",
}) {
  const { user, loading: authLoading, login, guilds, guildsLoading, loadGuilds } = useAuth();
  const [sendMode, setSendMode] = useState(defaultMode);
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
  const [result, setResult] = useState(null);

  const hasPayload = payload && typeof payload === "object" && Object.keys(payload).length > 0;
  const webhookValid = isValidWebhookUrl(webhookUrl);

  const botGuilds = useMemo(() => (guilds || []).filter((g) => g.botInGuild), [guilds]);
  const guildsWithoutBot = useMemo(() => (guilds || []).filter((g) => !g.botInGuild), [guilds]);
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
    ...payload,
    ...(allowWebhookOverrides && webhookUsername.trim() && { username: webhookUsername.trim() }),
    ...(allowWebhookOverrides && webhookAvatar.trim() && { avatar_url: webhookAvatar.trim() }),
  });

  const buildBotPayload = () => {
    const next = { ...payload };
    delete next.username;
    delete next.avatar_url;
    delete next.thread_name;
    return next;
  };

  const botReady = Boolean(user && guildId && channelId && selectedGuild?.botInGuild);
  const canSend =
    enabled &&
    hasPayload &&
    (sendMode === "webhook" ? webhookValid : botReady);

  const send = async () => {
    if (!canSend) return;
    setBusy("send");
    setResult(null);
    try {
      if (sendMode === "webhook") {
        const res = await fetch("/api/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhookUrl: webhookUrl.trim(), payload: buildWebhookPayload() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setResult({ ok: false, msg: data.error || "Failed to send message." });
          return;
        }
        if (data.id) setMessageId(String(data.id));
        setResult({ ok: true, msg: "Message sent!" });
        return;
      }

      const res = await fetch("/api/bot-messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, channelId, payload: buildBotPayload() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          ok: false,
          msg: data.error || "Failed to send message.",
          inviteUrl: data.inviteUrl,
        });
        return;
      }
      if (data.id) setMessageId(String(data.id));
      setResult({ ok: true, msg: "Message sent as the bot!" });
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const update = async () => {
    if (!canSend || !messageId.trim()) return;
    setBusy("update");
    setResult(null);
    try {
      if (sendMode === "webhook") {
        const res = await fetch("/api/webhook", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            webhookUrl: webhookUrl.trim(),
            messageId: messageId.trim(),
            payload,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setResult({ ok: false, msg: data.error || "Failed to update message." });
          return;
        }
        setResult({ ok: true, msg: "Message updated on Discord." });
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
          payload: buildBotPayload(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, msg: data.error || "Failed to update message." });
        return;
      }
      setResult({ ok: true, msg: "Message updated on Discord." });
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const load = async () => {
    if (!messageId.trim()) return;
    if (sendMode === "webhook" && !webhookValid) return;
    if (sendMode === "bot" && !botReady) return;

    setBusy("load");
    setResult(null);
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
        setResult({ ok: false, msg: data.error || "Failed to load message." });
        return;
      }
      setResult({ ok: true, msg: "Message loaded.", data });
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!messageId.trim()) return;
    if (sendMode === "webhook" && !webhookValid) return;
    if (sendMode === "bot" && !botReady) return;

    setBusy("delete");
    setResult(null);
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
        setResult({ ok: false, msg: data.error || "Failed to delete message." });
        return;
      }
      setMessageId("");
      setResult({ ok: true, msg: "Message deleted from Discord." });
    } catch {
      setResult({ ok: false, msg: "Request failed." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <ToolSection
      title="Send to Discord"
      description={
        description ||
        (messageId
          ? `Editing message ${messageId}`
          : sendMode === "webhook"
            ? "Send via webhook"
            : "Send as the bot into a server channel")
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
                setResult(null);
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
            {allowWebhookOverrides && (
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
            )}
          </>
        ) : authLoading ? (
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
                  setResult(null);
                }}
                options={
                  guildOptions.length
                    ? guildOptions
                    : [
                        {
                          value: "",
                          label: guildsLoading ? "Loading…" : "No manageable servers",
                          disabled: true,
                        },
                      ]
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

        {(showUpdate || showLoad || showDelete) && (
          <div>
            <FieldLabel hint="Auto-filled after send, or paste to load/edit">Message ID</FieldLabel>
            <Input
              value={messageId}
              onChange={(e) => setMessageId(e.target.value)}
              placeholder="Message ID"
              className="font-mono text-xs"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={send} disabled={!canSend || busy}>
            <Send className="w-3.5 h-3.5" />
            {busy === "send" ? "Sending..." : "Send"}
          </Button>
          {showUpdate && (
            <Button
              type="button"
              variant="secondary"
              onClick={update}
              disabled={!canSend || !messageId.trim() || busy}
            >
              <Pencil className="w-3.5 h-3.5" />
              {busy === "update" ? "Updating..." : "Update"}
            </Button>
          )}
          {showLoad && (
            <Button
              type="button"
              variant="secondary"
              onClick={load}
              disabled={
                !messageId.trim() ||
                busy ||
                (sendMode === "webhook" ? !webhookValid : !botReady)
              }
            >
              <Download className="w-3.5 h-3.5" />
              {busy === "load" ? "Loading..." : "Load"}
            </Button>
          )}
          {showDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={remove}
              disabled={
                !messageId.trim() ||
                busy ||
                (sendMode === "webhook" ? !webhookValid : !botReady)
              }
            >
              <Trash className="w-3.5 h-3.5" />
              {busy === "delete" ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>

        {!hasPayload && (
          <p className="text-xs text-[var(--nx-text-faint)]">
            Build a payload before sending.
          </p>
        )}
        {result && (
          <div className="space-y-1">
            <p className={cn("text-sm", result.ok ? "text-[#23a559]" : "text-[#f23f43]")}>
              {result.msg}
            </p>
            {result.inviteUrl && (
              <a
                href={result.inviteUrl}
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
  );
}
