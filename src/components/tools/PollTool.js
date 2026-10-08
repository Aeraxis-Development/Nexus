import { useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Toggle } from "../ui/toggle";
import ToolPanel, { ToolSection, FieldLabel, CopyCodeBlock, StatGrid, StatCard } from "../ToolPanel";
import DiscordSendPanel from "../DiscordSendPanel";
import {
  buildPollMessageJson,
  createExamplePoll,
  emptyAnswer,
} from "../../lib/polls";

export default function PollTool() {
  const [poll, setPoll] = useState(createExamplePoll);

  const payload = useMemo(() => buildPollMessageJson(poll), [poll]);
  const json = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  const update = (patch) => setPoll((prev) => ({ ...prev, ...patch }));

  const updateAnswer = (index, patch) => {
    update({
      answers: poll.answers.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    });
  };

  const addAnswer = () => {
    if (poll.answers.length >= 10) return;
    update({
      answers: [
        ...poll.answers,
        emptyAnswer(`Option ${poll.answers.length + 1}`),
      ],
    });
  };

  const removeAnswer = (index) => {
    if (poll.answers.length <= 2) return;
    update({ answers: poll.answers.filter((_, i) => i !== index) });
  };

  return (
    <ToolPanel fill>
      <StatGrid>
        <StatCard label="Answers" value={poll.answers.length} accent />
        <StatCard label="Duration (h)" value={poll.duration || 24} />
        <StatCard label="Multiselect" value={poll.allowMultiselect ? "Yes" : "No"} />
        <StatCard label="Max answers" value={10} />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <ToolSection
          title="Poll"
          description="Build message poll JSON (requires SEND_POLLS)"
          action={
            <Button size="sm" variant="secondary" onClick={() => setPoll(createExamplePoll())}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          }
        >
          <FieldLabel>Question</FieldLabel>
          <Input
            value={poll.question}
            onChange={(e) => update({ question: e.target.value.slice(0, 300) })}
            placeholder="Question"
            className="text-sm mb-4"
          />

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <FieldLabel hint="1–768 hours">Duration (hours)</FieldLabel>
              <Input
                type="number"
                min={1}
                max={768}
                value={poll.duration}
                onChange={(e) => update({ duration: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-end">
              <Toggle
                checked={poll.allowMultiselect}
                onCheckedChange={(v) => update({ allowMultiselect: v })}
                className="w-full flex-row-reverse justify-between py-2.5 px-3 rounded-lg border border-[var(--nx-border)] bg-[var(--nx-bg-input)]"
                label="Allow multiselect"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <FieldLabel>Answers ({poll.answers.length}/10)</FieldLabel>
            <Button size="sm" variant="secondary" disabled={poll.answers.length >= 10} onClick={addAnswer}>
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>

          <div className="space-y-2">
            {poll.answers.map((answer, index) => (
              <div
                key={answer.id}
                className="rounded-lg border border-[var(--nx-border)] p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase text-[var(--nx-text-faint)]">
                    Answer {index + 1}
                  </span>
                  <button
                    type="button"
                    disabled={poll.answers.length <= 2}
                    onClick={() => removeAnswer(index)}
                    className="p-1 rounded-md text-[var(--nx-red)] hover:bg-[var(--nx-red-soft)] disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Input
                  value={answer.text}
                  onChange={(e) => updateAnswer(index, { text: e.target.value.slice(0, 55) })}
                  placeholder="Answer text"
                  className="text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={answer.emojiName}
                    onChange={(e) => updateAnswer(index, { emojiName: e.target.value })}
                    placeholder="Emoji name"
                    className="text-xs"
                  />
                  <Input
                    value={answer.emojiId}
                    onChange={(e) =>
                      updateAnswer(index, { emojiId: e.target.value.replace(/\D/g, "") })
                    }
                    placeholder="Emoji ID"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </ToolSection>

        <div className="space-y-3 sm:space-y-4">
          <CopyCodeBlock
            label="Message JSON"
            value={json}
            emptyHint="Configure the poll to generate paste-ready message JSON."
          />
          <DiscordSendPanel
            payload={payload}
            enabled={Boolean(poll.question?.trim() && poll.answers?.length >= 2)}
            description="Bot needs SEND_POLLS · polls are create-only"
            showUpdate={false}
            showLoad={false}
            showDelete={false}
            defaultMode="bot"
          />
        </div>
      </div>
    </ToolPanel>
  );
}
