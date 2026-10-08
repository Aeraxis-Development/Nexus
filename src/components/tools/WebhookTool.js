import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import ToolPanel, { ToolSection, FieldLabel, CopyField } from "../ToolPanel";
import DiscordSendPanel from "../DiscordSendPanel";

export default function WebhookTool() {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [content, setContent] = useState("Hello from Nexus!");
  const [threadName, setThreadName] = useState("");

  const payloadObj = useMemo(
    () => ({
      ...(content.trim() && { content: content.trim() }),
      ...(username.trim() && { username: username.trim() }),
      ...(avatarUrl.trim() && { avatar_url: avatarUrl.trim() }),
      ...(threadName.trim() && { thread_name: threadName.trim() }),
    }),
    [content, username, avatarUrl, threadName]
  );

  const payload = JSON.stringify(payloadObj, null, 2);

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-4">
          <ToolSection title="Message">
            <div className="space-y-3">
              <div>
                <FieldLabel>Content</FieldLabel>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Message"
                  rows={5}
                  className="nx-textarea"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel hint="Webhook override (ignored in bot mode)">Username</FieldLabel>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Custom username"
                  />
                </div>
                <div>
                  <FieldLabel hint="Webhook override (ignored in bot mode)">Avatar URL</FieldLabel>
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>
              <div>
                <FieldLabel hint="Creates a thread in forum channels (webhook)">Thread Name</FieldLabel>
                <Input
                  value={threadName}
                  onChange={(e) => setThreadName(e.target.value)}
                  placeholder="Thread name"
                />
              </div>
            </div>
          </ToolSection>

          <DiscordSendPanel
            payload={payloadObj}
            enabled={Boolean(content.trim())}
            description="Send a simple message via webhook or bot"
            allowWebhookOverrides={false}
          />
        </div>

        <div className="space-y-4">
          <CopyField value={payload} label="JSON Payload" />
        </div>
      </div>
    </ToolPanel>
  );
}
