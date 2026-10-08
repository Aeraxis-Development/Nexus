import { useState } from "react";
import { Input } from "../ui/input";
import { availableScopes } from "../../lib/scopes";
import { getInviteUrl } from "../../lib/getInviteUrl";
import ToolPanel, { ToolSection, FieldLabel, CopyField } from "../ToolPanel";
import { useNexus } from "../../context/NexusContext";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { Toggle } from "../ui/toggle";

export default function OAuthTool() {
  const {
    clientId, setClientId,
    permissionValue,
    scopes, setScopes,
    redirectUri, setRedirectUri,
    requireCodeGrant, setRequireCodeGrant,
  } = useNexus();

  const toggleScope = (scope) => {
    setScopes((prev) => prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]);
  };

  const url = getInviteUrl({
    clientId,
    permissionValue,
    scopes,
    redirectUri,
    requireCodeGrant,
  });

  return (
    <ToolPanel fill>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 xl:h-full xl:min-h-0">
        <ToolSection title="Application" className="xl:col-span-1">
          <FieldLabel hint="Your bot's application (client) ID">Client ID</FieldLabel>
          <Input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Snowflake ID"
            className="font-mono"
          />
        </ToolSection>

        <ToolSection title="Redirect URI & Options" className="xl:col-span-1">
          <div className="space-y-4">
            <div>
              <FieldLabel hint="Optional — for user authorization flows">Callback URL</FieldLabel>
              <Input
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <Toggle
              checked={requireCodeGrant}
              onCheckedChange={setRequireCodeGrant}
              className="w-full flex-row-reverse justify-between p-4 rounded-lg border border-[var(--nx-border)] bg-[var(--nx-bg-input)]"
              label="Require Code Grant"
            />
          </div>
        </ToolSection>

        <ToolSection title="Generated URL" className="xl:col-span-1">
          <div className="space-y-3">
            <CopyField value={url} placeholder="Invite URL" label="Invite Link" />
            {clientId.trim() && (
              <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex px-3 py-1.5 rounded-lg bg-[var(--nx-bg-input)] border border-[var(--nx-border)] text-xs text-[var(--nx-text-muted)]">
                Permissions: <span className="font-mono text-[var(--nx-accent)] ml-1">{permissionValue}</span>
              </span>
              <span className="inline-flex px-3 py-1.5 rounded-lg bg-[var(--nx-bg-input)] border border-[var(--nx-border)] text-xs text-[var(--nx-text-muted)]">
                Scopes: <span className="font-mono text-[var(--nx-text-heading)] ml-1">{scopes.join(", ") || "none"}</span>
              </span>
              </div>
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[var(--nx-bg-overlay)] hover:bg-[var(--nx-bg-raised)] border border-[var(--nx-border)] text-sm font-medium text-[var(--nx-text)] transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Open in Discord
              </a>
            )}
          </div>
        </ToolSection>
      </div>

      <ToolSection title="Scopes" fill className="min-h-[300px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
          {availableScopes.map((scope) => (
            <button
              key={scope.value}
              type="button"
              onClick={() => toggleScope(scope.value)}
              className={cn(
                "nx-selectable",
                scopes.includes(scope.value) && "nx-selectable-active"
              )}
            >
              <p className="text-sm font-mono font-semibold text-[var(--nx-text-heading)]">{scope.label}</p>
              <p className="text-xs text-[var(--nx-text-muted)] mt-1 leading-relaxed">{scope.description}</p>
            </button>
          ))}
        </div>
      </ToolSection>
    </ToolPanel>
  );
}
